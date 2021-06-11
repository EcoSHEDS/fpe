# merging values and images

Sys.setenv(TZ = "GMT")

library(tidyverse)
library(lubridate)

config <- config::get()

con <- DBI::dbConnect(
  RPostgreSQL::PostgreSQL(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)

db_stations <-

# browns brook
station_id <- 6

db_values <- tbl(con, "stations") %>%
  select(station_id = id) %>%
  filter(station_id == !!station_id) %>%
  left_join(
    tbl(con, "datasets") %>%
      select(dataset_id = id, station_id),
    by = "station_id"
  ) %>%
  left_join(
    tbl(con, "series") %>%
      select(series_id = id, dataset_id, variable_id),
    by = "dataset_id"
  ) %>%
  left_join(tbl(con, "values"), by = "series_id") %>%
  arrange(series_id, timestamp) %>%
  collect()

db_images <- tbl(con, "stations") %>%
  select(station_id = id) %>%
  filter(station_id == !!station_id) %>%
  left_join(
    tbl(con, "imagesets") %>%
      select(imageset_id = id, station_id),
    by = "station_id"
  ) %>%
  left_join(
    tbl(con, "images") %>%
      select(id, imageset_id, filename, date, timestamp, width, height, exif, thumb_url),
    by = "imageset_id"
  ) %>%
  arrange(timestamp) %>%
  collect() %>%
  rowwise() %>%
  mutate(
    exif = list(jsonlite::fromJSON(exif))
  ) %>%
  ungroup()





