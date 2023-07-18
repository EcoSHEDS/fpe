library(tidyverse)
library(jsonlite)
library(lubridate)
library(janitor)
library(glue)
library(progress)

MIN_HOUR <- 7
MAX_HOUR <- 18

# fetch annotations -------------------------------------------------------

config <- config::get()
con <- DBI::dbConnect(
  RPostgres::Postgres(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)

annotations_dir <- "c:/Users/jdwalker/tmp/annotations/"

annotations_db <- tbl(con, "annotations") %>%
  left_join(
    tbl(con, "stations") %>%
      select(station_id = id, timezone),
    by = "station_id"
  ) %>%
  filter(status == "DONE") %>%
  collect()


# fetch json files
pb <- progress_bar$new(total = nrow(annotations_db))
annotations_data <- annotations_db %>%
  mutate(row = row_number()) %>%
  rowwise() %>%
  mutate(
    data = list({
      pb$tick()
      f <- file.path(annotations_dir, glue("{uuid}.json"))
      f %>%
        read_json(simplifyVector = TRUE, flatten = TRUE) %>%
        as_tibble()
    })
  )


# fetch image timestamps
annotations_imageIds <- annotations_data %>%
  mutate(
    imageIds = list({
      unique(c(data$left.imageId, data$right.imageId))
    })
    # images = list({
    #   x_image_ids <- unique(c(data$left.imageId, data$right.imageId))
    #   tbl(con, "images") %>%
    #     filter(id %in% local(x_image_ids)) %>%
    #     select(id, filename, timestamp) %>%
    #     collect() %>%
    #     mutate(
    #       timestamp = with_tz(timestamp, tzone = timezone),
    #       hour = hour(timestamp)
    #     )
    # })
  )

# fetch images
image_ids <- unique(unlist(annotations_images$imageIds))
images_db <- tbl(con, "images") %>%
      filter(id %in% local(image_ids)) %>%
      select(id, filename, timestamp) %>%
      collect()

# join images
annotations_images <- annotations_imageIds %>%
  mutate(
    images = list({
      tibble(
        id = image_ids
      ) %>%
        left_join(images_db, by = "id") %>%
        mutate(
          timestamp = with_tz(timestamp, tzone = timezone),
          hour = hour(timestamp)
        )
    })
  )

# classify daytime
annotations_daytime <- annotations_images %>%
  mutate(
    daytime = list({
      data %>%
        left_join(
          images %>%
            transmute(
              left.imageId = id,
              left.timestamp = timestamp,
              left.hour = hour
            ),
          by = "left.imageId"
        ) %>%
        left_join(
          images %>%
            transmute(
              right.imageId = id,
              right.timestamp = timestamp,
              right.hour = hour
            ),
          by = "right.imageId"
        ) %>%
        mutate(
          daytime = left.hour %in% MIN_HOUR:MAX_HOUR & right.hour %in% MIN_HOUR:MAX_HOUR
        ) %>%
        select(left.imageId, left.timestamp, left.hour, right.imageId, right.timestamp, right.hour, daytime)
    }),
    n = nrow(daytime),
    n_daytime = sum(daytime$daytime)
  )

annotations_daytime %>%
  transmute(frac_daytime = n_daytime / n) %>%
  summary()

pb <- progress_bar$new(total = nrow(annotations_daytime))
for (i in 1:nrow(annotations_daytime)) {
  pb$tick()
  id <- annotations_daytime$id[i]
  n_daytime <- annotations_daytime$n_daytime[i]
  DBI::dbExecute(con, "UPDATE annotations SET n_daytime=$1 WHERE id=$2", params = list(n_daytime, id))
}


DBI::dbDisconnect(con)
