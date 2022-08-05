# export data and images for a given station
# usage: Rscript export-station.R <id> <output dir>

Sys.setenv(TZ = "GMT")

library(tidyverse)
library(lubridate)
library(logger)

args <- commandArgs(trailingOnly = TRUE)
station_id <- parse_number(args[1])
output_dir <- path.expand(args[2])

log_info("station_id: {station_id}")
log_info("output_dir: {output_dir}")

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


# flow images -------------------------------------------------------------

flow_values <- values %>%
  filter(variable_id == "FLOW_CFS")

interp_flow_values <- approxfun(flow_values$timestamp, y = flow_values$value)

images_flow <- images %>%
  mutate(
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
ggsave(file.path(station_dir, "flow-images.png"), p, width = 8, height = 4)

images_flow %>%
  write_csv(file.path(station_dir, "flow-images.csv"), na = "")

file.copy(file.path(station_dir, "flow-images.csv"), file.path(output_dir, paste0(station$name, ".csv")), overwrite = TRUE)
