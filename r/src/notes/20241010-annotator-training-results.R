# training results for single user

library(tidyverse)
library(jsonlite)
library(lubridate)
library(logger)
library(janitor)

config <- config::get()

con <- DBI::dbConnect(
  RPostgres::Postgres(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)

annotations <- tbl(con, "annotations") %>%
  collect()

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

  if(nrow(x_raw)!=0){

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

  } else{

    data.frame()
  }
}

fetch_station_flow_images <- function(con, station_id) {
  log_info("fetching flow images (station_id={station_id})")
  station <- fetch_station(con, station_id)
  stopifnot(nrow(station) == 1)

  log_info("fetching images (station_id={station_id})")
  images <- fetch_station_images(con, station_id)
  stopifnot(nrow(images) > 0)

  if (!is.na(station$nwis_id) & (nchar(station$nwis_id)>4)) {
    start_timestamp <- min(images$timestamp)
    end_timestamp <- max(images$timestamp)
    log_info("fetching flows from NWIS (station_id={station_id}, start={start_timestamp}, end={end_timestamp})")
    values <- fetch_station_values_from_nwis(station, start_timestamp, end_timestamp)
  } else {
    log_info("fetching flows from FPE (station_id={station_id})")
    values <- fetch_station_values(con, station_id)
  }

  if(nrow(values>0)){

    flow_values <- values %>%
      filter(variable_id == "FLOW_CFS") %>%
      filter(!is.na(value))


    interp_flow_values <- approxfun(flow_values$timestamp, y = flow_values$value)
    log_info("interpolating flows by image (station_id={station_id})")

    images %>%
      mutate(
        flow_cfs = interp_flow_values(timestamp)
      ) %>%
      arrange(timestamp) %>%
      filter(!is.na(flow_cfs))


  } else{
    log_info("no NWIS or FPE flows, skipping (station_id={station_id})")
    return(NULL)
  }
}



# annotation results ------------------------------------------------------

annotations_training_files <- annotations %>%
  filter(training)

stations_training <- tibble(station_id = unique(annotations_training_files$station_id)) %>%
  mutate(
    data = map(station_id, function (station_id) {
      fetch_station(con, station_id) %>%
        select(-id)
    })
  ) %>%
  unnest(data)

flow_images_training <- tibble(station_id = unique(annotations_training_files$station_id)) %>%
  mutate(
    data = map(station_id, function (station_id) {
      fetch_station_flow_images(con, station_id) %>%
        mutate(timestamp = with_tz(timestamp, tzone = "US/Eastern")) %>%
        select(-station_id, -station_name)
    }),
    n_rows = map_int(data, nrow),
    n_values = map_int(data, ~ sum(!is.na(.$flow_cfs)))
  )

annotations_training_raw <- annotations_training_files %>%
  mutate(
    data = map(url, function (url) {
      url %>%
        read_json(simplifyVector = TRUE, flatten = TRUE) %>%
        as_tibble() %>%
        mutate(
          pair_id = row_number()
        )
    }, .progress = TRUE)
  )

annotations_training <- annotations_training_raw %>%
  select(id, user_id, station_id, uuid, flag, data) %>%
  unnest(data) %>%
  select(-comment, -left.attributes, -right.attributes) %>%
  left_join(
    flow_images_training %>%
      select(data) %>%
      unnest(data) %>%
      select(left.imageId = image_id, left.flow_cfs = flow_cfs, left.timestamp = timestamp),
    by = "left.imageId"
  ) %>%
  left_join(
    flow_images_training %>%
      select(data) %>%
      unnest(data) %>%
      select(right.imageId = image_id, right.flow_cfs = flow_cfs, right.timestamp = timestamp),
    by = "right.imageId"
  ) %>%
  rename(user_rank = rank) %>%
  mutate(
    left.hour = hour(left.timestamp),
    left.daytime = between(left.hour, 7, 18),
    right.hour = hour(right.timestamp),
    right.daytime = between(right.hour, 7, 18),
    delta_flow_cfs = abs(left.flow_cfs - right.flow_cfs),
    avg_flow_cfs = (left.flow_cfs + right.flow_cfs) / 2,
    rel_delta_flow_cfs = delta_flow_cfs / avg_flow_cfs,
    true_rank = case_when(
      left.flow_cfs < right.flow_cfs ~ "RIGHT",
      left.flow_cfs > right.flow_cfs ~ "LEFT",
      left.flow_cfs == right.flow_cfs ~ "SAME",
      TRUE ~ NA_character_
    ),
    user_rank_lr = if_else(
      user_rank %in% c("UNKNOWN", "SAME"),
      NA,
      user_rank
    ),
    user_rank = factor(user_rank, levels = c(NA, unique(user_rank))),
    true_rank = factor(true_rank, levels = levels(user_rank)),
    user_rank_lr = factor(user_rank_lr, levels = levels(user_rank)),
    both_daytime = left.daytime & right.daytime,
    both_nighttime = !left.daytime & !right.daytime,
    one_nighttime = left.daytime | right.daytime
  ) %>%
  filter(both_daytime) %>%
  mutate(
    correct = case_when(
      user_rank %in% c("LEFT", "RIGHT") ~ user_rank == true_rank
    )
  )

annotations_training %>%
  tabyl(user_id, user_rank)
annotations_training %>%
  tabyl(true_rank, user_rank, user_id)
annotations_training %>%
  tabyl(user_id, correct) %>%
  adorn_percentages(denominator = "col")
annotations_training %>%
  group_by(user_id) %>%
  summarise(
    accuracy = mean(correct, na.rm = TRUE)
  )

annotations_training %>%
  group_by(user_id, station_id) %>%
  summarize(
    n = n(),
    n_flag = sum(flag),
    accuracy = mean(correct, na.rm = TRUE)
  ) %>%
  arrange(accuracy)

annotations_training %>%
  filter(!is.na(correct)) %>%
  group_by(user_id, station_id) %>%
  mutate(
    n = row_number(),
    cumul_mean_accuracy = cummean(correct)
  ) %>%
  ggplot(aes(n, cumul_mean_accuracy)) +
  geom_line(aes(group = user_id)) +
  facet_grid(vars(user_id), vars(station_id))

annotations_training %>%
  filter(!is.na(correct)) %>%
  left_join(select(stations_training, station_id, station_name = name), by = "station_id") %>%
  group_by(user_id, station_id) %>%
  mutate(
    n = row_number(),
    cumul_mean_accuracy = cummean(correct)
  ) %>%
  ggplot(aes(n, cumul_mean_accuracy, color = station_name)) +
  geom_line(aes(group = interaction(user_id), color = str_sub(user_id, 1, 5))) +
  labs(x = "# pairs", y = "cumul. accuracy") +
  facet_wrap(vars(station_id))

annotations_training %>%
  mutate(has_user_rank = user_rank %in% c("LEFT", "RIGHT")) %>%
  tabyl(station_id, has_user_rank, user_id) %>%
  adorn_percentages() %>%
  adorn_pct_formatting()

annotations_training %>%
  mutate(has_user_rank = user_rank %in% c("LEFT", "RIGHT")) %>%
  tabyl(station_id, has_user_rank, user_id) %>%
  adorn_percentages() %>%
  adorn_pct_formatting()

annotations_training %>%
  ggplot(aes(left.flow_cfs, right.flow_cfs)) +
  geom_abline() +
  geom_point(aes(color = user_rank)) +
  geom_point(
    data = ~ subset(., user_rank != true_rank),
    aes(color = "WRONG"),
    size = 3, pch = 21
  ) +
  scale_x_log10() +
  scale_y_log10() +
  theme(aspect.ratio = 1) +
  facet_wrap(vars(str_sub(user_id, 1, 5)))
