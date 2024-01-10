# export daily dataset
# [station, date, n_images, n_annotated_images, flow_cfs]

library(tidyverse)
library(glue)

config <- config::get()

con <- DBI::dbConnect(
  RPostgres::Postgres(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)


# stations ----------------------------------------------------------------

stations <- DBI::dbGetQuery(con, "
  select s.user_id,
    u.affiliation_code,
    s.id as station_id,
    s.name as station_name,
    s.latitude,
    s.longitude,
    s.private,
    s.nwis_id,
    s.status
  from stations s
  left join users u on u.id=s.user_id
") %>%
  as_tibble()


# images ------------------------------------------------------------------

daily_images <- DBI::dbGetQuery(con, "
  with im_date as (
    select station_id,
      ims.id as imageset_id,
      (im.timestamp at time zone s.timezone)::date as date
    from imagesets ims
    left join stations s on s.id=ims.station_id
    left join images im on ims.id=im.imageset_id
  )
  select station_id, date, count(*) as n_images
  from im_date
  group by station_id, date
") %>%
  as_tibble()

daily_images_nest <- daily_images %>%
  arrange(station_id, date) %>%
  nest_by(station_id)


# values ------------------------------------------------------------------

daily_values_fpe <- DBI::dbGetQuery(con, "
  with d_date as (
    select d.station_id,
      d.id as dataset_id,
      ss.id as series_id,
      ss.variable_id,
      (v.timestamp at time zone s.timezone)::date as date,
      v.value
    from datasets d
    left join stations s on s.id=d.station_id
    left join series ss on d.id=ss.dataset_id
    left join values v on ss.id=v.series_id
  )
  select station_id, variable_id, date, count(*) as n_values, avg(value) as mean_value
  from d_date
  group by station_id, variable_id, date
") %>%
  as_tibble()

daily_values_fpe_nest <- daily_values_fpe %>%
  transmute(station_id, date, name = tolower(variable_id), value = mean_value) %>%
  filter(name %in% c("flow_cfs")) %>%
  pivot_wider() %>%
  arrange(station_id, date) %>%
  nest_by(station_id)

daily_values_nwis <- stations %>%
  select(station_id, nwis_id) %>%
  filter(!is.na(nwis_id), nwis_id != "") %>%
  inner_join(
    daily_images %>%
      group_by(station_id) %>%
      summarise(start = min(date), end = max(date)),
    by = "station_id"
  ) %>%
  rowwise() %>%
  mutate(
    data = list({
      dataRetrieval::readNWISdv(
        siteNumbers = nwis_id,
        parameterCd = "00060",
        startDate = as.character(start),
        endDate = as.character(end)
      ) %>%
        dataRetrieval::renameNWISColumns()
    })
  )

daily_values_nwis_nest <- daily_values_nwis %>%
  select(station_id, data) %>%
  filter(nrow(data) > 0) %>%
  mutate(
    data = list({
      data %>%
        select(date = Date, flow_cfs = Flow) %>%
        filter(!is.na(flow_cfs))
    })
  )

daily_values_nest <- daily_values_fpe_nest %>%
  ungroup() %>%
  unnest(data) %>%
  rename(fpe_flow_cfs = flow_cfs) %>%
  full_join(
    daily_values_nwis_nest %>%
      ungroup() %>%
      unnest(data) %>%
      rename(nwis_flow_cfs = flow_cfs),
    by = c("station_id", "date")
  ) %>%
  mutate(
    flow_cfs = coalesce(nwis_flow_cfs, fpe_flow_cfs)
  ) %>%
  filter(!is.na(flow_cfs)) %>%
  select(station_id, date, flow_cfs) %>%
  arrange(station_id, date) %>%
  nest_by(station_id)


# annotations -------------------------------------------------------------


annotations_db <- DBI::dbGetQuery(con, "
  select id as annotation_id,
    station_id,
    user_id,
    uuid,
    n,
    n_daytime,
    url
  from annotations
  where n_daytime is not null and n_daytime > 0 and user_id <> '9bc0d5e3-a871-4ffa-ae4f-1cbc44b0ea17'
") %>%
  as_tibble()

annotations_files <- annotations_db %>%
  rowwise() %>%
  mutate(
    data = list({
      jsonlite::read_json(url, simplifyVector = TRUE)
    })
  )

annotations_data <- annotations_files %>%
  unnest(data) %>%
  transmute(
    station_id,
    annotation_id,
    left.image_id = left$imageId,
    right.image_id = right$imageId,
    rank
  ) %>%
  print()


images_db <- DBI::dbGetQuery(con, "
  select im.id as image_id,
    im.timestamp at time zone s.timezone as timestamp_local,
    (im.timestamp at time zone s.timezone)::date as date
  from imagesets ims
  left join stations s on s.id=ims.station_id
  left join images im on ims.id=im.imageset_id
") %>%
  as_tibble()

annotations_images <- annotations_data %>%
  select(station_id, left.image_id, right.image_id) %>%
  pivot_longer(-station_id) %>%
  select(station_id, image_id = value) %>%
  left_join(images_db, by = "image_id")

annotations_daily <- annotations_images %>%
  count(station_id, date, name = "n_annotations")

annotations_daily_daytime <- annotations_images %>%
  filter(hour(timestamp_local) %in% 7:18) %>%
  count(station_id, date, name = "n_annotations_daytime")


# daily -------------------------------------------------------------------


daily <- daily_images_nest %>%
  unnest(data) %>%
  full_join(
    daily_values_nest %>%
      unnest(data),
    by = c("station_id", "date")
  ) %>%
  mutate(n_images = coalesce(n_images, 0L)) %>%
  ungroup() %>%
  mutate(
    status = case_when(
      n_images > 0 & !is.na(flow_cfs) ~ "images + flow",
      n_images > 0 & is.na(flow_cfs) ~ "images only",
      TRUE ~ NA_character_
    )
  ) %>%
  group_by(station_id) %>%
  mutate(
    n_images_flow = sum(status == "images + flow", na.rm = TRUE),
    n_images_total = sum(n_images)
  ) %>%
  ungroup() %>%
  left_join(annotations_daily, by = c("station_id", "date")) %>%
  left_join(annotations_daily_daytime, by = c("station_id", "date")) %>%
  mutate(
    n_annotations = coalesce(n_annotations, 0),
    n_annotations_daytime = coalesce(n_annotations_daytime, 0)
  )

daily %>%
  filter(n_images_flow > 365) %>%
  left_join(select(stations, affiliation_code, station_id, station_name), by = "station_id") %>%
  arrange(n_images_flow, n_images_total) %>%
  mutate(station_name = fct_inorder(glue("{affiliation_code}: {station_name} (id={station_id})"))) %>%
  ggplot(aes(date, station_name)) +
  geom_point(aes(color = status, shape = status, size = log1p(n_annotations_daytime))) +
  scale_color_manual(values = c("orangered", "gray50")) +
  scale_shape_manual(values = c(16, 21)) +
  theme_bw()

daily %>%
  ggplot(aes(n_annotations, n_annotations_daytime)) +
  geom_point()

# export ------------------------------------------------------------------

daily %>%
  left_join(
    stations %>%
      select(affiliation_code, station_id, station_name),
    by = "station_id"
  ) %>%
  filter(affiliation_code != "ADMIN") %>%
  select(
    affiliation_code, station_id, station_name,
    date, n_images, n_annotations, n_annotations_daytime, flow_cfs
  ) %>%
  arrange(station_id, date) %>% names() %>% dput()
  write_csv("export/daily/daily-summary.csv", na = "")

stations %>%
  filter(affiliation_code != "ADMIN") %>%
  arrange(station_id) %>%
  write_csv("export/daily/stations.csv", na = "")

images_timestamps <- images_db %>%
  mutate(
    timestamp_local = format(timestamp_local, "%Y-%m-%d %H:%M:%S")
  )

annotations_data %>%
  select(-annotation_id) %>%
  left_join(
    stations %>%
      select(affiliation_code, station_id, station_name),
    by = "station_id"
  ) %>%
  filter(affiliation_code != "ADMIN") %>%
  left_join(
    images_timestamps %>%
      select(left.image_id = image_id, left.timestamp_local = timestamp_local),
    by = "left.image_id"
  ) %>%
  left_join(
    images_timestamps %>%
      select(right.image_id = image_id, right.timestamp_local = timestamp_local),
    by = "right.image_id"
  ) %>%
  relocate(affiliation_code, .before = everything()) %>%
  relocate(station_name, .after = station_id) %>%
  relocate(left.timestamp_local, .after = left.image_id) %>%
  relocate(right.timestamp_local, .after = right.image_id) %>%
  write_csv("export/daily/annotations.csv", na = "")

