# human annotation training datasets

Sys.setenv(TZ = "GMT")

library(tidyverse)
library(janitor)
library(jsonlite)
library(lubridate)
library(logger)

config <- config::get()

# functions ---------------------------------------------------------------

fetch_station <- function(con, station_id) {
  DBI::dbGetQuery(con, "select * from stations where id = $1", list(station_id)) %>%
    as_tibble()
}

fetch_station_values <- function(con, station_id) {
  DBI::dbGetQuery(con, "
select st.name as station_name, d.station_id, s.dataset_id, s.id as series_id, s.variable_id, v.timestamp, v.value, v.flag from
datasets d
left join series s on d.id = s.dataset_id
left join values v on s.id = v.series_id
left join stations st on st.id = d.station_id
where d.station_id = $1
and d.status = 'DONE'
", list(station_id)) %>%
    as_tibble()
}

fetch_station_images <- function(con, station_id) {
  DBI::dbGetQuery(con, "
select s.name as station_name, iset.station_id, i.imageset_id, i.id as image_id, i.timestamp, i.filename, i.full_url as url from
imagesets iset
left join images i on iset.id = i.imageset_id
left join stations s on s.id = iset.station_id
where iset.station_id = $1
and i.status = 'DONE'
", list(station_id)) %>%
    as_tibble()
}

fetch_station_values_from_nwis <- function(station, start, end) {
  x_raw <- dataRetrieval::readNWISuv(station$nwis_id, parameterCd = "00060", startDate = as_date(start) - days(1), endDate = as_date(end) + days(1)) %>%
    tibble()
  dataRetrieval::renameNWISColumns(x_raw) %>%
    select(timestamp = dateTime, value = Flow_Inst, flag = Flow_Inst_cd) %>%
    mutate(
      station_name = station$name,
      station_id = station$id,
      dataset_id = "NWIS",
      series_id = NA_character_,
      variable_id = "FLOW_CFS",
      .before = "timestamp"
    ) %>%
    mutate(
      flag = na_if(flag, "A")
    ) %>%
    filter(!is.na(value))
}

fetch_flow_images <- function(con, station) {
  log_info("fetching: images")
  images <- fetch_station_images(con, station$id)

  log_info("fetching: values")
  if (!is.na(na_if(station$nwis_id, ""))) {
    start_timestamp <- min(images$timestamp)
    end_timestamp <- max(images$timestamp)
    values <- fetch_station_values_from_nwis(station, start_timestamp, end_timestamp)
  } else {
    values <- fetch_station_values(con, station_id)
  }

  log_info("merging images and values")
  flow_values <- values %>%
    filter(variable_id == "FLOW_CFS") %>%
    filter(!is.na(value))

  if (nrow(flow_values) > 0) {
    interp_flow_values <- approxfun(flow_values$timestamp, y = flow_values$value)

    log_info("estimating flow for each image")
    images_flow <- images %>%
      mutate(
        filename = map_chr(url, ~ httr::parse_url(.)$path),
        flow_cfs = interp_flow_values(timestamp),
        timestamp = with_tz(timestamp, tzone = station$timezone)
      ) %>%
      arrange(timestamp) %>%
      filter(!is.na(flow_cfs))
    return(images_flow)
  } else {
    log_info("no values, returning only images")
    images_flow <- images %>%
      mutate(
        filename = map_chr(url, ~ httr::parse_url(.)$path),
        flow_cfs = NA_real_,
        timestamp = with_tz(timestamp, tzone = station$timezone)
      ) %>%
      arrange(timestamp)
    return(images_flow)
  }
}

fetch_annotations <- function (con, station, flow_images) {
  log_info("fetching: annotations from db")
  annotations_db <- tbl(con, "annotations") %>%
    filter(
      station_id == local(station$id)
    ) %>%
    left_join(
      select(tbl(con, "stations"), station_id = id, station_name = name),
      by = "station_id"
    ) %>%
    select(annotation_id = id, user_id, station_id, station_name, duration_sec, n, url) %>%
    collect()

  log_info("fetching: annotations from s3")
  annotations_raw <- annotations_db %>%
    rowwise() %>%
    mutate(
      data = list({
        url %>%
          read_json(simplifyVector = TRUE, flatten = TRUE) %>%
          as_tibble() %>%
          mutate(pair_id = row_number())
      })
    )

  log_info("merging: flow/images with annotations")
  annotations <- annotations_raw %>%
    mutate(
      data = list({
        data %>%
          mutate(
            left.attributes = map_chr(left.attributes, \(x) str_c(x, collapse = ",")),
            right.attributes = map_chr(right.attributes, \(x) str_c(x, collapse = ","))
          ) %>%
          inner_join(
            flow_images %>%
              select(left.imageId = image_id, left.timestamp = timestamp, left.flow_cfs = flow_cfs, left.url = url, left.filename = filename),
            by = "left.imageId"
          ) %>%
          inner_join(
            flow_images %>%
              select(right.imageId = image_id, right.timestamp = timestamp, right.flow_cfs = flow_cfs, right.url = url, right.filename = filename),
            by = "right.imageId"
          ) %>%
          mutate(
            delta_flow_cfs = abs(left.flow_cfs - right.flow_cfs),
            avg_flow_cfs = (left.flow_cfs + right.flow_cfs) / 2,
            rel_delta_flow_cfs = delta_flow_cfs / avg_flow_cfs,
            true_rank = case_when(
              left.flow_cfs < right.flow_cfs ~ "RIGHT",
              left.flow_cfs > right.flow_cfs ~ "LEFT",
              left.flow_cfs == right.flow_cfs ~ "SAME",
              TRUE ~ NA_character_
            ),
            comment = as.character(comment)
          )
      })
    ) %>%
    unnest(data) %>%
    filter(rank != "UNKNOWN")
  annotations
}

duplicate_pairs <- function (x) {
  x2 <- bind_cols(
    select(x, pair),
    select(x, ends_with("_2")) %>%
      rename_with(~ str_replace(., "2", "1")),
    select(x, ends_with("_1")) %>%
      rename_with(~ str_replace(., "1", "2")),
    transmute(x, pair_label = -1 * pair_label)
  )
  bind_rows(x, x2) %>%
    arrange(pair)
}

split_pairs <- function (x, seed = 1691) {
  x2 <- x %>%
    rowwise() %>%
    mutate(
      min_timestamp = min(left.timestamp, right.timestamp),
      max_timestamp = max(left.timestamp, right.timestamp),
      start_year =  year(as_date(min_timestamp)),
      end_year =  year(as_date(max_timestamp))
    )
  test_cutoff <- quantile(x2$min_timestamp, probs = 0.9)
  pairs <- x2 %>%
    ungroup() %>%
    transmute(
      image_id_1 = left.imageId,
      timestamp_1 = left.timestamp,
      filename_1 = left.filename,
      label_1 = left.flow_cfs,
      image_id_2 = right.imageId,
      timestamp_2 = right.timestamp,
      filename_2 = right.filename,
      label_2 = right.flow_cfs,
      pair_label = case_when(
        rank == "SAME" ~ 0,
        rank == "LEFT" ~ 1,
        rank == "RIGHT" ~ -1
      ),
      pair = row_number()
    )

  pairs_test <- pairs %>%
    filter(timestamp_1 >= test_cutoff, timestamp_2 >= test_cutoff)

  set.seed(seed)
  pairs_train_val <- pairs %>%
    filter(timestamp_1 < test_cutoff, timestamp_2 < test_cutoff) %>%
    mutate(
      split = if_else(runif(n()) < 0.2, "val", "train")
    )
  pairs_train <- pairs_train_val %>%
    filter(split == "train") %>%
    select(-split)
  pairs_val <- pairs_train_val %>%
    filter(split == "val") %>%
    select(-split)

  list(
    train = duplicate_pairs(pairs_train),
    val = duplicate_pairs(pairs_val),
    test = duplicate_pairs(pairs_test)
  )
}

export_input <- function(flow_images, pairs, dir, notes) {
  flow_images %>%
    write_csv(file.path(dir, "flow-images.csv"))

  pairs$train %>%
    write_csv(file.path(dir, "pairs-train.csv"))
  pairs$val %>%
    write_csv(file.path(dir, "pairs-val.csv"))
  pairs$test %>%
    write_csv(file.path(dir, "pairs-test.csv"))

  manifest <- bind_rows(
    pairs$train,
    pairs$val,
    pairs$test
  ) %>%
    select(filename_1, filename_2) %>%
    pivot_longer(everything()) %>%
    pull(value) %>%
    unique()

  manifest %>%
    write_json(file.path(dir, "manifest.json"), auto_unbox = TRUE)

  list(
    method = "human",
    num_train_pairs = nrow(pairs$train) / 2,
    num_val_pairs = nrow(pairs$val) / 2,
    num_test_pairs = nrow(pairs$test) / 2,
    notes = notes
  ) %>%
    write_json(file.path(dir, "args.json"), auto_unbox = TRUE)
}


# run ---------------------------------------------------------------------

con <- DBI::dbConnect(
  RPostgres::Postgres(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)

station_id <- 12
station <- fetch_station(con, station_id)
flow_images <- fetch_flow_images(con, station)
annotations <- fetch_annotations(con, station, flow_images)
pairs <- annotations %>%
  filter(
    user_id != "9bc0d5e3-a871-4ffa-ae4f-1cbc44b0ea17",
    hour(annotations$left.timestamp) %in% 7:18,
    hour(annotations$right.timestamp) %in% 7:18
  ) %>%
  split_pairs()

export_input(flow_images, pairs, dir = "D:/fpe/sites/AVERYBB/models/20230922/input", notes = "exclude user_id=9bc0d5e3, exclude nighttime (7PM-7AM)")
# manually add: {"prefix": "s3://usgs-chs-conte-prod-fpe-storage/"},

flow_images %>%
  ggplot(aes(timestamp, flow_cfs)) +
  geom_line()

annotations %>%
  tabyl(rank, true_rank)

annotations %>%
  ggplot() +
  geom_segment(
    aes(
      x = left.timestamp, xend = right.timestamp,
      y = left.flow_cfs, yend = right.flow_cfs,
      color = rank
    )
  ) +
  scale_color_brewer(palette = "Set1") +
  scale_y_log10() +
  theme_bw()

bind_rows(
  train = pairs$train,
  val = pairs$val,
  test = pairs$test,
  .id = "split"
) %>%
  ggplot() +
  geom_segment(
    aes(
      x = timestamp_1, xend = right.timestamp,
      y = left.flow_cfs, yend = right.flow_cfs,
      color = rank
    )
  ) +
  scale_color_brewer(palette = "Set1") +
  scale_y_log10() +
  theme_bw()

