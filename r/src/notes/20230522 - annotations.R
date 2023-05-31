library(tidyverse)
library(jsonlite)
library(lubridate)
library(janitor)

# westbrook



config <- config::get()

con <- DBI::dbConnect(
  RPostgres::Postgres(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)

flow_images <- bind_rows(
  `29` = read_csv("d:/fpe/westbrook/20230523/West Brook 0_01171100/flow-images.csv"),
  `12` = read_csv("d:/fpe/westbrook/20230523/Avery Brook_Bridge_01171000/flow-images.csv"),
  .id = "station_id"
) %>%
  mutate(station_id = as.numeric(station_id)) %>%
  select(-station_name)

annotations_db <- tbl(con, "annotations") %>%
  filter(
    n > 500
  ) %>%
  left_join(
    select(tbl(con, "stations"), station_id = id, station_name = name),
    by = "station_id"
  ) %>%
  select(annotation_id = id, user_id, station_id, station_name, duration_sec, n, url) %>%
  collect()

annotations_raw <- annotations_db %>%
  rowwise() %>%
  mutate(
    data = list(as_tibble(read_json(url, simplifyVector = TRUE, flatten = TRUE)))
  )

annotations <- annotations_raw %>%
  mutate(
    flow_images = list(filter(flow_images, station_id == station_id)),
    user_id = str_sub(user_id, 1, 5),
    data = list({
      data %>%
        mutate(
          left.attributes = map_chr(left.attributes, \(x) str_c(x, collapse = ",")),
          right.attributes = map_chr(right.attributes, \(x) str_c(x, collapse = ","))
        ) %>%
        left_join(
          flow_images %>%
            select(left.imageId = image_id, left.flow_cfs = flow_cfs, left.url = url),
          by = "left.imageId"
        ) %>%
        left_join(
          flow_images %>%
            select(right.imageId = image_id, right.flow_cfs = flow_cfs, right.url = url),
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
  select(-flow_images) %>%
  unnest(data)

annotations %>%
  tabyl(rank, true_rank, station_name) %>%
  adorn_totals(where = "both")

annotations %>%
  tabyl(rank, station_name) %>%
  adorn_totals(where = "both") %>%
  adorn_percentages(denominator = "col")

annotations %>%
  filter(rank %in% c("LEFT", "RIGHT")) %>%
  ggplot(aes(right.flow_cfs, left.flow_cfs)) +
  geom_abline() +
  geom_point(aes(y = if_else(rank == true_rank, left.flow_cfs, NA_real_), color = rank == true_rank), size = 3, alpha = 0.5) +
  geom_point(aes(y = if_else(rank == true_rank, NA_real_, left.flow_cfs), color = rank == true_rank), size = 3) +
  scale_x_log10() +
  scale_y_log10() +
  scale_color_manual(
    "Annotation\nAccuracy",
    labels = c("TRUE" = "Correct", "FALSE" = "Incorrect"),
    values = c("TRUE" = "gray50", "FALSE" = "orangered")
  ) +
  labs(
    x = "Right Image Flow (cfs)", y = "Left Image Flow (cfs)",
    subtitle = "EPA Intern Accuracy when annotation is LEFT or RIGHT (excludes SAME, or UNKNOWN)\nRed points shows when annotator chose LEFT or RIGHT, but true comparison was opposite of what they chose"
  ) +
  facet_grid(vars(user_id), vars(station_name), labeller = "label_both") +
  theme_bw()

annotations %>%
  filter(rank %in% c("LEFT", "RIGHT")) %>%
  mutate(correct = rank == true_rank) %>%
  tabyl(user_id, correct, station_name) %>%
  # adorn_totals(where = "col") %>%
  adorn_percentages()

annotations %>%
  filter(rank %in% c("LEFT", "RIGHT")) %>%
  ggplot(aes(avg_flow_cfs, rel_delta_flow_cfs)) +
  geom_point(aes(y = if_else(rank == true_rank, rel_delta_flow_cfs, NA_real_), color = rank == true_rank), size = 3, alpha = 0.5) +
  geom_point(aes(y = if_else(rank == true_rank, NA_real_, rel_delta_flow_cfs), color = rank == true_rank), size = 3) +
  scale_x_log10() +
  scale_y_continuous(labels = scales::percent) +
  scale_color_manual(
    "Annotation\nAccuracy",
    labels = c("TRUE" = "Correct", "FALSE" = "Incorrect"),
    values = c("TRUE" = "gray50", "FALSE" = "orangered")
  ) +
  labs(
    x = "Average Flow (cfs)\n(Left Flow + Right Flow) / 2", y = "Relative Flow Difference (%)\nabs(Left Flow - Right Flow) / Average Flow",
    subtitle = "EPA Intern Accuracy when annotation is LEFT or RIGHT (excludes SAME, or UNKNOWN)\nRed points shows when annotator chose LEFT or RIGHT, but true comparison was opposite of what they chose"
  ) +
  facet_grid(vars(user_id), vars(station_name), labeller = "label_both") +
  theme_bw()

annotations %>%
  filter(rank != "UNKNOWN") %>%
  ggplot(aes(avg_flow_cfs, rel_delta_flow_cfs, color = rank)) +
  geom_point(aes(y = if_else(rank != "SAME", rel_delta_flow_cfs, NA_real_), color = rank), size = 3, alpha = 0.5) +
  geom_point(aes(y = if_else(rank != "SAME", NA_real_, rel_delta_flow_cfs), color = rank), size = 3) +
  scale_x_log10() +
  scale_y_continuous(labels = scales::percent, breaks = scales::pretty_breaks(n = 8)) +
  scale_color_manual("Annotation\nRank", values = c("LEFT" = "gray50", "RIGHT" = "gray50", "SAME" = "deepskyblue")) +
  labs(
    x = "Average Flow (cfs)\n(Left Flow + Right Flow) / 2", y = "Relative Flow Difference (%)\nabs(Left Flow - Right Flow) / Average Flow",
    subtitle = "EPA Intern Margin Distribution (excludes UNKNOWN)\nBlue points shows when annotator chose SAME indicating actual flow differences over range of average flows"
  ) +
  facet_grid(vars(user_id), vars(station_name), labeller = "label_both") +
  theme_bw()

annotations %>%
  filter(rank == "SAME") %>%
  ggplot(aes(rel_delta_flow_cfs, linetype = user_id, color = station_name)) +
  stat_ecdf() +
  scale_color_brewer("Station", palette = "Set1") +
  scale_x_continuous(labels = scales::percent, breaks = scales::pretty_breaks(n = 8)) +
  scale_y_continuous(labels = scales::percent, breaks = scales::pretty_breaks(n = 8), expand = expansion()) +
  labs(
    x = "Relative Flow Difference (%)\nabs(Left Flow - Right Flow) / Average Flow",
    y = "Cumulative Frequency",
    linetype = "User ID",
    subtitle = "EPA Intern Margin Distribution (excludes UNKNOWN)\nShows cumulative frequency distribution of relative flow difference when annotator chose SAME (medians are ~35-40% relative flow difference)"
  ) +
  # facet_grid(vars(user_id), vars(station_name), labeller = "label_both") +
  theme_bw()

annotations %>%
  filter(rank == "SAME") %>%
  arrange(desc(rel_delta_flow_cfs)) %>%
  slice(2) %>%
  as.list()

write_csv(x, "~/westbrook0-annotations-20230523.csv")

