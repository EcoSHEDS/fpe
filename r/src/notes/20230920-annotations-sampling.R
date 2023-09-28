# sampling strategies for splitting annotations

Sys.setenv(TZ = "GMT")

library(tidyverse)
library(janitor)
library(jsonlite)
library(lubridate)
library(logger)

station_id <- 29 # westbrook zero

config <- config::get()

con <- DBI::dbConnect(
  RPostgres::Postgres(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)


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

log_info("fetching: station")
station <- fetch_station(con, station_id)
stopifnot(nrow(station) == 1)

log_info("fetching: images")
images <- fetch_station_images(con, station_id)

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

interp_flow_values <- approxfun(flow_values$timestamp, y = flow_values$value)

log_info("estimating flow for each image")
images_flow <- images %>%
  mutate(
    filename = map_chr(url, ~ httr::parse_url(.)$path),
    flow_cfs = interp_flow_values(timestamp),
    timestamp = with_tz(timestamp, tzone = "US/Eastern")
  ) %>%
  arrange(timestamp) %>%
  filter(!is.na(flow_cfs))

p <- flow_values %>%
  ggplot(aes(timestamp, value)) +
  geom_line() +
  geom_point(
    data = images_flow,
    aes(y = flow_cfs),
    size = 0.25, color = "deepskyblue"
  )
p

log_info("fetching: annotations from db")
annotations_db <- tbl(con, "annotations") %>%
  filter(
    station_id == local(station_id)
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
        left_join(
          images_flow %>%
            select(left.imageId = image_id, left.timestamp = timestamp, left.flow_cfs = flow_cfs, left.url = url, left.filename = filename),
          by = "left.imageId"
        ) %>%
        left_join(
          images_flow %>%
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
          )
        )
    })
  ) %>%
  unnest(data)

annotations %>%
  tabyl(rank)

annotations %>%
  filter(rank != "UNKNOWN") %>%
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

annotations %>%
  filter(rank != "UNKNOWN") %>%
  mutate(row = row_number()) %>%
  select(row, rank, left.flow_cfs, right.flow_cfs) %>%
  pivot_longer(-c(row, rank), names_to = c("side", "param"), names_sep = "\\.") %>%
  ggplot(aes(side, value)) +
  geom_line(aes(group = row, color = rank)) +
  scale_color_brewer(palette = "Set1") +
  facet_wrap(vars(rank)) +
  scale_y_log10() +
  theme_bw()

annotations %>%
  filter(rank != "UNKNOWN") %>%
  mutate(row = row_number()) %>%
  select(row, rank, left.flow_cfs, right.flow_cfs) %>%
  mutate(
    right.flow_cfs = right.flow_cfs - left.flow_cfs,
    left.flow_cfs = left.flow_cfs - left.flow_cfs
  ) %>%
  pivot_longer(-c(row, rank), names_to = c("side", "param"), names_sep = "\\.") %>%
  ggplot(aes(side, value)) +
  geom_hline(yintercept = 0) +
  geom_line(aes(group = row, color = rank), alpha = 0.5) +
  scale_color_brewer(palette = "Set1") +
  facet_wrap(vars(rank)) +
  theme_bw()


n_exclude <- sum(
  !hour(annotations$left.timestamp) %in% 7:18 |
    !hour(annotations$right.timestamp) %in% 7:18 |
    # !month(annotations$left.timestamp) %in% 4:11 |
    # !month(annotations$right.timestamp) %in% 4:11 |
    annotations$rank == "UNKNOWN"
) %>% print()

nrow(annotations) - n_exclude

x <- annotations %>%
  filter(
    rank != "UNKNOWN",
    hour(left.timestamp) %in% 7:18,
    hour(right.timestamp) %in% 7:18,
    user_id != "9bc0d5e3-a871-4ffa-ae4f-1cbc44b0ea17"
    # month(left.timestamp) %in% 4:11,
    # month(right.timestamp) %in% 4:11
  ) %>%
  rowwise() %>%
  mutate(
    min_timestamp = min(left.timestamp, right.timestamp),
    max_timestamp = max(left.timestamp, right.timestamp),
    start_year =  year(as_date(min_timestamp)),
    end_year =  year(as_date(max_timestamp))
  )
nrow(x)

x %>%
  select(min_timestamp, max_timestamp) %>%
  pivot_longer(everything()) %>%
  group_by(name) %>%
  mutate(i = row_number(value)) %>%
  ggplot(aes(value, i)) +
  geom_line() +
  facet_wrap(vars(name))

x %>%
  tabyl(start_year, end_year)
  # adorn_percentages(denominator = "all") %>%
  # adorn_pct_formatting()

nrow(x)




n_exclude_unknown <- sum(annotations$rank == "UNKNOWN")
n_exclude_daytime <- sum(
  annotations$rank == "UNKNOWN" |
  !hour(annotations$left.timestamp) %in% 7:18 |
  !hour(annotations$right.timestamp) %in% 7:18
)
n_exclude_winter <- sum(
  annotations$rank == "UNKNOWN" |
  !hour(annotations$left.timestamp) %in% 7:18 |
  !hour(annotations$right.timestamp) %in% 7:18 |
  !month(annotations$left.timestamp) %in% 4:11 |
  !month(annotations$right.timestamp) %in% 4:11
)
n_exclude_unknown
n_exclude_daytime - n_exclude_unknown
n_exclude_winter - n_exclude_daytime - n_exclude_unknown



# export pairs ------------------------------------------------------------

pairs <- x %>%
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
  ) %>%
  print()

pairs_test <- pairs %>%
  filter(year(timestamp_1) == 2023, year(timestamp_2) == 2023)

set.seed(1691)
pairs_train_val <- pairs %>%
  filter(year(timestamp_1) == 2022, year(timestamp_2) == 2022) %>%
  mutate(
    split = if_else(runif(n()) < 0.2, "val", "train")
  )
pairs_train <- pairs_train_val %>%
  filter(split == "train") %>%
  select(-split)
pairs_val <- pairs_train_val %>%
  filter(split == "val") %>%
  select(-split)

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

pairs_train <- duplicate_pairs(pairs_train)
pairs_val <- duplicate_pairs(pairs_val)
pairs_test <- duplicate_pairs(pairs_test)

pairs_train %>%
  write_csv("D:/fpe/sites/WESTB0/models/20230921/input/pairs-train.csv")
pairs_val %>%
  write_csv("D:/fpe/sites/WESTB0/models/20230921/input/pairs-val.csv")
pairs_test %>%
  write_csv("D:/fpe/sites/WESTB0/models/20230921/input/pairs-test.csv")

manifest <- bind_rows(
  pairs_train,
  pairs_val,
  pairs_test
) %>%
  select(filename_1, filename_2) %>%
  pivot_longer(everything()) %>%
  pull(value) %>%
  unique()
manifest %>%
  write_json("D:/fpe/sites/WESTB0/models/20230921/input/manifest.json", auto_unbox = TRUE)
# manually insert {"prefix": "s3://usgs-chs-conte-prod-fpe-storage/"}

list(
  method = "human",
  num_train_pairs = nrow(pairs_train) / 2,
  num_val_pairs = nrow(pairs_val) / 2,
  num_test_pairs = nrow(pairs_test) / 2,
  notes = "exclude nighttime (7PM-7AM), exclude rank=UNKNOWN, exclude user_id=9bc0d, train/val=2022, test=2023"
) %>%
  write_json("D:/fpe/sites/WESTB0/models/20230921/input/args.json", auto_unbox = TRUE)


# compare 20230920 vs 20230921

x <- bind_rows(
  `20230920` = read_csv("D:/fpe/sites/WESTB0/models/20230920/transform/predictions.csv"),
  `20230921` = read_csv("D:/fpe/sites/WESTB0/models/20230921/transform/predictions.csv"),
  .id = "run"
)
x_hr <- x %>%
  group_by(run, timestamp = floor_date(timestamp, "hours")) %>%
  summarise(flow_cfs = mean(flow_cfs), score = mean(score), .groups = "drop") %>%
  group_by(run) %>%
  mutate(
    rank_obs = rank(flow_cfs) / n(),
    rank_pred = rank(score) / n()
  ) %>%
  ungroup()



x_hr %>%
  ggplot(aes(timestamp)) +
  geom_line(aes(y = rank_obs, size = "Obs"), alpha = 0.5) +
  geom_line(aes(y = rank_pred, color = run), alpha = 0.9, size = 0.5) +
  scale_color_brewer("Run", palette = "Set1") +
  scale_size_manual(NULL, values = 2) +
  scale_y_continuous(labels = scales::percent, limits = c(0, 1)) +
  labs(y = "Rank") +
  facet_wrap(vars(date = floor_date(timestamp, unit = "month")), scales = "free_x") +
  theme_bw()
