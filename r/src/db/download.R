# download images and data

library(tidyverse)
library(lubridate)
library(progress)
library(logger)

root <- "/Volumes/Backup Plus/fpe/db-beta/"
stopifnot(dir.exists(root))

config <- config::get()

con <- DBI::dbConnect(
  RPostgreSQL::PostgreSQL(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)

download_affiliation <- function (affiliation_code) {
  log_info("affiliation: {affiliation_code}")
  db_stations <- tbl(con, "users") %>%
    filter(affiliation_code == !!affiliation_code) %>%
    select(user_id = id, affiliation_code) %>%
    left_join(
      tbl(con, "stations") %>%
        rename(station_id = id),
      by = "user_id"
    )

  db_datasets <- db_stations %>%
    select(user_id, affiliation_code, station_id, station_name = name) %>%
    left_join(
      tbl(con, "datasets") %>%
        rename(dataset_id = id),
      by = "station_id"
    )

  db_imagesets <- db_stations %>%
    select(user_id, affiliation_code, station_id, station_name = name) %>%
    left_join(
      tbl(con, "imagesets") %>%
        rename(imageset_id = id, imageset_uuid = uuid),
      by = "station_id"
    )

  db_images <- db_imagesets %>%
    select(affiliation_code, station_id, station_name, imageset_id, imageset_uuid) %>%
    left_join(
      tbl(con, "images") %>%
        select(imageset_id, id, filename, url = full_url),
      by = "imageset_id"
    )

  df_stations <- collect(db_stations)
  for (i in 1:nrow(df_stations)) {
    row <- df_stations[i, ]
    with(row, {
      log_info("station ({i}/{nrow(df_stations)}): {affiliation_code}/{name}")
      folder <- file.path(root, affiliation_code, name)
      dir.create(folder, showWarnings = FALSE, recursive = TRUE)

      row %>%
        select(name, description, latitude, longitude, timezone, metadata) %>%
        mutate(metadata = list(jsonlite::fromJSON(metadata))) %>%
        jsonlite::write_json(file.path(folder, "station.json"), auto_unbox = TRUE, pretty = TRUE, digits = 8)
    })
  }

  df_datasets <- collect(db_datasets)
  for (i in 1:nrow(df_datasets)) {
    row <- df_datasets[i, ]
    with(row, {
      log_info("dataset ({i}/{nrow(df_datasets)}): {affiliation_code}/{station_name}/datasets/{uuid}/{filename}")
      folder <- file.path(root, affiliation_code, station_name, "datasets", uuid)
      dir.create(file.path(folder, "files"), showWarnings = FALSE, recursive = TRUE)

      write_file(config, file.path(folder, "config.json"))
      write_file(metadata, file.path(folder, "metadata.json"))

      if (!file.exists(file.path(folder, "files", filename))) {
        download.file(url, file.path(folder, "files", filename), quiet = TRUE)
      }
    })
  }

  df_imagesets <- collect(db_imagesets)
  for (i in 1:nrow(df_imagesets)) {
    row <- df_imagesets[i, ]
    with(row, {
      log_info("imageset ({i}/{nrow(df_imagesets)}): {affiliation_code}/{station_name}/imagesets/{imageset_uuid}")
      folder <- file.path(root, affiliation_code, station_name, "imagesets", imageset_uuid)

      dir.create(file.path(folder, "images"), showWarnings = FALSE, recursive = TRUE)

      write_file(config, file.path(folder, "config.json"))
      write_file(metadata, file.path(folder, "metadata.json"))
    })
  }


  df_images <- collect(db_images)
  log_info("images: n={nrow(df_images)}")
  pb <- progress_bar$new(
    format = "  downloading [:bar] :percent eta: :eta",
    total = nrow(df_images), clear = FALSE, width= 60
  )
  for (i in 1:nrow(df_images)) {
    pb$tick()
    row <- df_images[i, ]
    with(row, {
      folder <- file.path(root, affiliation_code, station_name, "imagesets", imageset_uuid, "images")
      if (!file.exists(file.path(folder, filename))) {
        download.file(url, file.path(folder, filename), quiet = TRUE)
      }
    })
  }
}

download_affiliation("PDNR")
download_affiliation("MPCA")
