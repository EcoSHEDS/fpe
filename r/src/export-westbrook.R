# export data and images for all westbrook stations

Sys.setenv(TZ = "GMT")

library(tidyverse)
library(lubridate)
library(logger)

config <- config::get()

con <- DBI::dbConnect(
  RPostgreSQL::PostgreSQL(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$dbname,
  user = config$db$user,
  password = config$db$password
)

fetch_station <- function(con, station_id) {
  DBI::dbGetQuery(con, "select id, name, description, latitude, longitude, timezone from stations where id = $1", list(station_id)) %>%
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

export_station <- function(con, station_id, output_dir) {
  log_info("exporting: station_id={station_id}")

  log_info("fetching: station")
  station <- fetch_station(con, station_id)
  stopifnot(nrow(station) == 1)

  log_info("fetching: values")
  values <- fetch_station_values(con, station_id)

  log_info("fetching: images")
  images <- fetch_station_images(con, station_id)

  station_dir <- file.path(output_dir, station$name)
  if (!dir.exists(station_dir)) {
    log_info("creating: {station_dir}")
    dir.create(station_dir, showWarnings = FALSE, recursive = TRUE)
  }

  log_info("saving: {file.path(station_dir, 'station.csv')} (n={scales::comma(nrow(station))})")
  write_csv(station, file.path(station_dir, "station.csv"), na = "")

  if (nrow(values) > 0) {
    log_info("saving: {file.path(station_dir, 'values.csv')} (n={scales::comma(nrow(values))})")
    write_csv(values, file.path(station_dir, "values.csv"), na = "")
  } else {
    log_warn("no values")
  }

  if (nrow(images) > 0) {
    log_info("saving: {file.path(station_dir, 'images.csv')} (n={scales::comma(nrow(images))})")
    write_csv(images, file.path(station_dir, "images.csv"), na = "")
  } else {
    log_warn("no images")
  }
}

output_dir <- "C:/Users/jdwalker/Projects/fpe-data/westbrook/"
westbrook_stations <- DBI::dbGetQuery(
  con,
  "select id from stations where user_id=$1",
  list("0626d282-0267-40b0-8f17-214c8f72e551")
)

for (station_id in sort(westbrook_stations$id)) {
  export_station(con, station_id, output_dir)
}
