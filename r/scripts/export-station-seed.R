#!/usr/bin/env Rscript
# export station for frontend dev
# usage: Rscript export-station-seed.R <station_id> <folder_name>
# example: Rscript export-station-seed.R --from 2022-02-01 --to 2022-06-30 29 WESTB0

Sys.setenv(TZ = "GMT")

suppressPackageStartupMessages(library(tidyverse))
suppressPackageStartupMessages(library(jsonlite))
suppressPackageStartupMessages(library(lubridate))
suppressPackageStartupMessages(library(logger))
suppressPackageStartupMessages(library(glue))
suppressPackageStartupMessages(library(argparser, quietly = TRUE))

p <- arg_parser("Export data from database for a single station", hide.opts = TRUE)

p <- add_argument(p, "station_id", help="station ID", type="numeric")
p <- add_argument(p, "folder_name", help="name of export folder")
p <- add_argument(p, "--output-dir", help="path to output directory (station root)", default="D:/fpe/dev")
p <- add_argument(p, "--bucket-name", help="name of s3 storage bucket", default="usgs-chs-conte-prod-fpe-storage")
p <- add_argument(p, "--from", help="start date")
p <- add_argument(p, "--to", help="end date")
p <- add_argument(p, "--replace", help="replace output directory (if exists)", flag=TRUE)

argv <- parse_args(p)

station_id <- argv$station_id
folder_name <- argv$folder_name
output_dir <- argv$output_dir
bucket_name <- argv$bucket_name
from <- argv$from
to <- argv$to

log_info("station_id: {station_id}")
log_info("folder_name: {folder_name}")
log_info("output_dir: {output_dir}")
log_info("bucket_name: {bucket_name}")
log_info("from: {from}")
log_info("to: {to}")

stopifnot(
  "output_dir not found" = dir.exists(output_dir)
)

station_dir <- file.path(output_dir, folder_name)
data_dir <- file.path(station_dir, "db")

mkdirp <- function (x) {
  if (!dir.exists(x)) {
    log_info("creating: {x}")
    dir.create(x, recursive = TRUE, showWarnings = FALSE)
  }
}

if (dir.exists(data_dir)) {
  if (argv$replace) {
    log_info("replacing: {data_dir}")
    ok <- unlink(data_dir, recursive = TRUE)
    stopifnot("failed to delete directory" = ok == 0)
    dir.create(data_dir)
  } else {
    log_warn("{data_dir} already exists but will not be replaced, files might be out of sync")
  }
}

mkdirp(data_dir)

# connect -----------------------------------------------------------------

config <- config::get()

con <- DBI::dbConnect(
  RPostgres::Postgres(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)


# station -----------------------------------------------------------------

db_stn <- DBI::dbGetQuery(con, "select * from stations where id = $1", list(station_id)) %>%
  as_tibble() %>%
  select(-id, -created_at, -updated_at, -user_id) %>%
  mutate(
    across(c(metadata, waterbody_type, status), as.character)
  )

log_info("saving: station.json")
db_stn %>%
  as.list() %>%
  write_json(file.path(data_dir, "station.json"), auto_unbox = TRUE, pretty = TRUE)


# datasets ----------------------------------------------------------------

db_datasets <- DBI::dbGetQuery(
  con,
  "select * from datasets where station_id = $1 order by start_timestamp",
  list(station_id)
) %>%
  as_tibble() %>%
  mutate(
    across(c(status, config, s3, metadata), as.character),
    across(c(url, s3), ~ str_replace(., bucket_name, "{STORAGE_BUCKET}"))
  )

if (!is.na(from)) {
  db_datasets <- db_datasets %>%
    filter(
      as_date(end_timestamp) >= from
    )
}
if (!is.na(to)) {
  db_datasets <- db_datasets %>%
    filter(
      as_date(start_timestamp) <= to
    )
}

if (nrow(db_datasets) > 0) {
  for (i in 1:nrow(db_datasets)) {
    dataset <- db_datasets[i,]
    dataset_dir <- file.path("datasets", dataset$uuid)
    mkdirp(file.path(data_dir, dataset_dir))

    dataset_file <- file.path(dataset_dir, "dataset.json")
    log_info("saving: {file.path(dataset_file)}")
    dataset %>%
      select(-id, -station_id, -created_at, -updated_at) %>%
      as.list() %>%
      write_json(file.path(data_dir, dataset_file), auto_unbox = TRUE, pretty = TRUE)

    db_series <- DBI::dbGetQuery(
      con,
      "select * from series where dataset_id = $1",
      list(dataset$id)
    ) %>%
      as_tibble()

    if (nrow(db_series) > 0) {
      mkdirp(file.path(data_dir, dataset_dir, "series"))
      for (j in 1:nrow(db_series)) {
        series <- db_series[j,]

        db_values <- DBI::dbGetQuery(
          con,
          "select * from values where series_id = $1",
          list(series$id)
        ) %>%
          as_tibble()

        if (nrow(db_values) > 0) {
          series_file <- file.path(dataset_dir, "series", glue("{series$variable_id}.json"))
          log_info("saving: {file.path(series_file)}")
          db_values %>%
            select(-id, -series_id) %>%
            write_json(file.path(data_dir, series_file), auto_unbox = TRUE, pretty = TRUE)
        }
      }
    }
  }
}


# imagesets ----------------------------------------------------------------

db_imagesets <- DBI::dbGetQuery(
  con,
  "select * from imagesets where station_id = $1 order by start_timestamp",
  list(station_id)
) %>%
  as_tibble() %>%
  mutate(
    across(c(status, config, metadata, pii_status), as.character)
  )

if (!is.na(from)) {
  db_imagesets <- db_imagesets %>%
    filter(
      as_date(end_timestamp) >= from
    )
}
if (!is.na(to)) {
  db_imagesets <- db_imagesets %>%
    filter(
      as_date(start_timestamp) <= to
    )
}

if (nrow(db_imagesets) > 0) {
  for (i in 1:nrow(db_imagesets)) {
    imageset <- db_imagesets[i,]
    imageset_dir <- file.path("imagesets", imageset$uuid)
    mkdirp(file.path(data_dir, imageset_dir))

    imageset_file <- file.path(imageset_dir, "imageset.json")
    log_info("saving: {file.path(imageset_file)}")
    imageset %>%
      select(-id, -station_id, -created_at, -updated_at) %>%
      as.list() %>%
      write_json(file.path(data_dir, imageset_file), auto_unbox = TRUE, pretty = TRUE)

    db_images <- DBI::dbGetQuery(
      con,
      "select * from images where imageset_id = $1 order by timestamp",
      list(imageset$id)
    ) %>%
      as_tibble()

    if (nrow(db_images) > 0) {
      images_file <- file.path(imageset_dir, "images.json")
      log_info("saving: {file.path(images_file)}")

      db_images %>%
        mutate(
          across(
            c(full_s3, full_url, thumb_s3, thumb_url, status, pii_detections),
            as.character
          ),
          across(
            c(full_s3, full_url, thumb_s3, thumb_url),
            ~ str_replace(., bucket_name, "{STORAGE_BUCKET}")
          ),
          timestamp = format_ISO8601(timestamp, usetz = TRUE)
        ) %>%
        select(-id, -imageset_id, -created_at, -updated_at) %>%
        write_json(file.path(data_dir, images_file), auto_unbox = TRUE, pretty = TRUE)
    }
  }
}


# models ------------------------------------------------------------------

# TODO: add model output files

