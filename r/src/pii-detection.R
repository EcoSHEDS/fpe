Sys.setenv(TZ = "GMT")

library(tidyverse)
library(lubridate)

config <- config::get()

con <- DBI::dbConnect(
  RPostgres::Postgres(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)

db_station <- tbl(con, "stations") %>%
  select(station_id = id, station_name = name, nwis_id)
db_imagesets <- tbl(con, "imagesets") %>%
  select(imageset_id = id, station_id, imageset_status = status, pii_status)
db_images <- tbl(con, "images") %>%
  select(image_id = id, imageset_id, timestamp, pii_person)

x <- db_station %>%
  left_join(db_imagesets, by = "station_id") %>%
  left_join(db_images, by = "imageset_id") %>%
  collect()

x %>%
  filter(pii_person > 0) %>%
  ggplot(aes(pii_person)) +
  geom_histogram(binwidth = 0.1, boundary = 0, closed = "left") +
  scale_x_continuous(breaks = scales::pretty_breaks(n = 5), limits = c(0, 1)) +
  ylab("# images")

x %>%
  filter(pii_person > 0) %>%
  mutate(pii_person = cut(pii_person, breaks = seq(0, 1, by = 0.1))) %>%
  count(pii_person)

x %>%
  filter(pii_person > 0.2) %>%
  nrow

