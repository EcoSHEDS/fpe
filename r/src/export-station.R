# export flow-images.csv and annotations.csv for a given station
# usage: Rscript export-station.R <id> <output dir>

Sys.setenv(TZ = "GMT")

library(tidyverse)
library(jsonlite)
library(lubridate)
library(logger)

args <- commandArgs(trailingOnly = TRUE)
station_id <- parse_number(args[1])
output_dir <- path.expand(args[2])

log_info("station_id: {station_id}")
log_info("output_dir: {output_dir}")

dir.create(output_dir, showWarnings = FALSE)
stopifnot(dir.exists(output_dir))

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

log_info("saving: {file.path(output_dir, 'station.json')}")
station %>%
  select(-waterbody_type, -status, -metadata) %>%
  as.list() %>%
  write_json(file.path(output_dir, "station.json"), auto_unbox = TRUE)

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

# station_dir <- file.path(output_dir, station$name)
# if (!dir.exists(station_dir)) {
#   log_info("creating: {station_dir}")
#   dir.create(station_dir, showWarnings = FALSE, recursive = TRUE)
# }

# if (nrow(values) > 0) {
#   log_info("saving: {file.path(station_dir, 'values.csv')} (n={scales::comma(nrow(values))})")
#   write_csv(values, file.path(station_dir, "values.csv"), na = "")
# } else {
#   log_warn("no values")
# }

# if (nrow(images) > 0) {
#   log_info("saving: {file.path(station_dir, 'images.csv')} (n={scales::comma(nrow(images))})")
#   write_csv(images, file.path(station_dir, "images.csv"), na = "")
# } else {
#   log_warn("no images")
# }


# flow images -------------------------------------------------------------

if (nrow(values) > 0) {
  flow_values <- values %>%
    filter(variable_id == "FLOW_CFS") %>%
    filter(!is.na(value))

  interp_flow_values <- approxfun(flow_values$timestamp, y = flow_values$value)

  log_info("estimating flow for each image")

  images_flow <- images %>%
    mutate(
      filename = map_chr(url, ~ httr::parse_url(.)$path),
      flow_cfs = interp_flow_values(timestamp)
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
  log_info("saving: {file.path(output_dir, 'flow-images.png')}")
  ggsave(file.path(output_dir, "flow-images.png"), p, width = 8, height = 4)
} else {
  images_flow <- images %>%
    mutate(
      filename = map_chr(url, ~ httr::parse_url(.)$path),
      flow_cfs = NA_real_
    ) %>%
    arrange(timestamp)

}
log_info("saving: {file.path(output_dir, 'flow-images.csv')}")
images_flow %>%
  write_csv(file.path(output_dir, "flow-images.csv"), na = "")

log_info("saving: {file.path(output_dir, 'flow-images-train.csv')}")
images_flow_train <- images_flow %>%
  mutate(
    timestamp = with_tz(timestamp, tzone = station$timezone[[1]])
  ) %>%
  filter(
    hour(timestamp) %in% 7:18,
    month(timestamp) %in% 4:11
  )
images_flow_train %>%
  write_csv(file.path(output_dir, "flow-images-train.csv"), na = "")


# annotations -------------------------------------------------------------

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
            select(left.imageId = image_id, left.flow_cfs = flow_cfs, left.url = url, left.filename = filename),
          by = "left.imageId"
        ) %>%
        left_join(
          images_flow %>%
            select(right.imageId = image_id, right.flow_cfs = flow_cfs, right.url = url, right.filename = filename),
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

stopifnot(
  all(!is.na(annotations$left.url)),
  all(!is.na(annotations$right.url))
)

log_info("saving: {file.path(output_dir, 'annotations.csv')}")
annotations %>%
  write_csv(file.path(output_dir, "annotations.csv"), na = "")

annotations_train <- annotations %>%
  filter(
    left.imageId %in% images_flow_train$image_id,
    right.imageId %in% images_flow_train$image_id
  )

log_info("saving: {file.path(output_dir, 'annotations-train.csv')}")
annotations_train %>%
  write_csv(file.path(output_dir, "annotations-train.csv"), na = "")
