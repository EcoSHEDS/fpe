library(tidyverse)
library(lubridate)
library(glue)

x <- read_csv("flow-images-train-predictions.csv") %>%
  mutate(
    timestamp = with_tz(timestamp, tzone = "US/Eastern"),
    date = as_date(timestamp),
    hour = hour(timestamp),
    rank_obs = rank(flow_cfs),
    rank_pred = rank(score)
  )
x_day <- x %>%
  group_by(date) %>%
  summarise(
    flow_cfs = mean(flow_cfs),
    score = mean(score)
  ) %>%
  mutate(
    rank_obs = rank(flow_cfs),
    rank_pred = rank(score)
  )

tau <- cor(x$flow_cfs, x$score, method = "kendall")

x_site <- "West Brook 0_01171100"
x_period <- str_c(as_date(range(x$timestamp)), collapse = " to ")
x_subtitle <- glue("Station: {x_site} | Period: {x_period} | # Images: {scales::comma(nrow(x))}")

x %>%
  ggplot(aes(flow_cfs, score)) +
  geom_point(size = 0.1) +
  scale_x_log10() +
  labs(
    x = "Obs Flow (cfs)",
    y = "Predicted Score",
    title = "Observed Flow vs Predicted Score",
    subtitle = x_subtitle
  ) +
  theme_bw() +
  theme(aspect.ratio = 1)

x %>%
  ggplot(aes(rank_obs, rank_pred)) +
  geom_point(size = 0.1) +
  geom_abline(color = "orangered") +
  scale_x_continuous(breaks = scales::pretty_breaks(), expand = expansion(), limits = c(0, NA)) +
  scale_y_continuous(breaks = scales::pretty_breaks(), expand = expansion(), limits = c(0, NA)) +
  labs(
    x = "Observed Rank",
    y = "Predicted Rank",
    title = "Observed vs. Predicted Ranks",
    subtitle = glue("{x_subtitle}\nKendall Tau = {sprintf('%.3f', tau)}")
  ) +
  theme_bw() +
  theme(aspect.ratio = 1)

x %>%
  complete(date = seq.Date(min(x$date), max(x$date), by = "1 day")) %>%
  mutate(
    timestamp = coalesce(timestamp, as.POSIXct(date))
  ) %>%
  transmute(timestamp, `log(flow_cfs)` = log10(flow_cfs), score) %>%
  pivot_longer(-timestamp) %>%
  ggplot(aes(timestamp, value, color = name)) +
  geom_line() +
  scale_x_datetime(date_labels = "%b %Y", date_breaks = "2 months", expand = expansion()) +
  facet_wrap(vars(name), scales = "free_y", ncol = 1, strip.position = "left", labeller = labeller(
    name = c("log(flow_cfs)" = "Obs log10(Flow [cfs])", "score" = "Pred Score")
  )) +
  labs(x = "Date", y = NULL) +
  scale_color_brewer(NULL, palette = "Set1", labels = c("log(flow_cfs)" = "Obs", "score" = "Pred"), guide = "none") +
  labs(
    x = "Date",
    title = "Timeseries of Observed Flow and Predicted Scores",
    subtitle = x_subtitle
  ) +
  theme_bw() +
  theme(
    strip.placement = "outside",
    strip.background = element_blank(),
    strip.text = element_text(size = 12)
  )

x %>%
  complete(date = seq.Date(min(x$date), max(x$date), by = "1 day")) %>%
  mutate(
    timestamp = coalesce(timestamp, as.POSIXct(date))
  ) %>%
  ggplot(aes(timestamp)) +
  geom_line(aes(y = rank_obs / nrow(x), color = "Obs")) +
  geom_point(aes(y = rank_pred / nrow(x), color = "Pred"), size = 0.2) +
  scale_color_brewer(NULL, palette = "Set1") +
  scale_x_datetime(date_labels = "%b %Y", date_breaks = "2 months", expand = expansion()) +
  scale_y_continuous(breaks = scales::pretty_breaks(n = 8), labels = scales::percent_format(accuracy = 1), expand = expansion()) +
  guides(
    color = guide_legend(override.aes = list(linetype = c(1, 0), size = c(0, 2), shape = c(0, 16)))
  ) +
  labs(
    x = "Date",
    y = "Percentile Rank",
    title = "Timeseries of Observed and Predicted Ranks",
    subtitle = x_subtitle
  ) +
  theme_bw()

x %>%
  filter(
    timestamp >= ymd(20220801),
    timestamp < ymd(20221001)
  ) %>%
  ggplot(aes(timestamp)) +
  geom_line(aes(y = rank_obs / nrow(x), color = "Obs")) +
  geom_point(aes(y = rank_pred / nrow(x), color = "Pred"), size = 0.2) +
  scale_color_brewer(NULL, palette = "Set1") +
  scale_x_datetime(date_labels = "%b %d, %Y", expand = expansion(c(0.01, 0))) +
  scale_y_continuous(breaks = scales::pretty_breaks(n = 8), labels = scales::percent_format(accuracy = 1), expand = expansion()) +
  guides(
    color = guide_legend(override.aes = list(linetype = c(1, 0), size = c(0, 2), shape = c(0, 16)))
  ) +
  labs(
    x = "Date",
    y = "Percentile Rank",
    title = "Timeseries of Observed and Predicted Ranks",
    subtitle = glue("Station: {x_site} | Period: 2022-08-01 to 2022-09-30 | # Images: 2,923")
  ) +
  theme_bw()

x %>%
  filter(
    timestamp >= ymd(20220801),
    timestamp < ymd(20221001)
  ) %>%
  mutate(rank_resid = (rank_obs - rank_pred) / nrow(x)) %>%
  ggplot(aes(timestamp, rank_resid)) +
  geom_hline(yintercept = 0) +
  geom_point(size = 0.2) +
  scale_x_datetime(date_labels = "%b %d, %Y", expand = expansion(c(0.01, 0))) +
  scale_y_continuous(breaks = scales::pretty_breaks(n = 8), labels = scales::percent_format(accuracy = 1), expand = expansion()) +
  labs(
    x = "Date",
    y = "Percentile Rank Residual (Obs-Pred)",
    title = "Timeseries of Percentile Rank Residuals (Obs - Predicted)",
    subtitle = glue("Station: {x_site} | Period: 2022-08-01 to 2022-09-30 | # Images: 2,923")
  ) +
  theme_bw()

x %>%
  complete(date = seq.Date(min(x$date), max(x$date), by = "1 day")) %>%
  mutate(
    timestamp = coalesce(timestamp, as.POSIXct(date))
  ) %>%
  mutate(rank_resid = (rank_obs - rank_pred) / nrow(x)) %>%
  ggplot(aes(timestamp, rank_resid)) +
  geom_hline(yintercept = 0) +
  geom_point(size = 0.2) +
  scale_x_datetime(date_labels = "%b %Y", date_breaks = "2 months", expand = expansion()) +
  scale_y_continuous(breaks = scales::pretty_breaks(n = 8), labels = scales::percent_format(accuracy = 1), expand = expansion()) +
  labs(
    x = "Date",
    y = "Percentile Rank Residual (Obs-Pred)",
    title = "Timeseries of Percentile Rank Residuals (Obs - Predicted)",
    subtitle = x_subtitle
  ) +
  theme_bw()


x %>%
  mutate(rank_resid = (rank_obs - rank_pred) / nrow(x)) %>%
  ggplot(aes(rank_pred / nrow(x), rank_resid)) +
  geom_hline(yintercept = 0) +
  geom_point(size = 0.2) +
  scale_y_continuous(breaks = scales::pretty_breaks(n = 8), labels = scales::percent_format(accuracy = 1), expand = expansion()) +
  scale_x_continuous(breaks = scales::pretty_breaks(n = 8), labels = scales::percent_format(accuracy = 1), expand = expansion(), limits = c(0, 1)) +
  labs(
    x = "Predicted Percentile Rank",
    y = "Percentile Rank Residual (Obs-Pred)",
    title = "Percentile Rank Residuals vs Fitted",
    subtitle = x_subtitle
  ) +
  theme_bw() +
  theme(aspect.ratio = 1)


x %>%
  mutate(rank_resid = (rank_obs - rank_pred) / nrow(x)) %>%
  ggplot(aes(hour(timestamp), rank_resid)) +
  geom_hline(yintercept = 0) +
  geom_jitter(height = 0, size = 0.2) +
  scale_y_continuous(breaks = scales::pretty_breaks(n = 8), labels = scales::percent_format(accuracy = 1), expand = expansion()) +
  scale_x_continuous(breaks = scales::pretty_breaks(n = 10)) +
  labs(
    x = "Hour of Day",
    y = "Percentile Rank Residual (Obs-Pred)",
    title = "Percentile Rank Residuals vs Hour of Day (Diurnal Pattern)",
    subtitle = x_subtitle
  ) +
  theme_bw() +
  theme(aspect.ratio = 1)

x %>%
  mutate(rank_resid = (rank_obs - rank_pred) / nrow(x)) %>%
  ggplot(aes(yday(timestamp), rank_resid)) +
  geom_hline(yintercept = 0) +
  geom_jitter(height = 0, size = 0.2) +
  scale_y_continuous(breaks = scales::pretty_breaks(n = 8), labels = scales::percent_format(accuracy = 1), expand = expansion()) +
  scale_x_continuous(breaks = scales::pretty_breaks(n = 10)) +
  labs(
    x = "Julian Day",
    y = "Percentile Rank Residual (Obs-Pred)",
    title = "Percentile Rank Residuals vs Julian Day (Seasonal Pattern)",
    subtitle = x_subtitle
  ) +
  theme_bw() +
  theme(aspect.ratio = 1)


x_day %>%
  complete(date = seq.Date(min(x$date), max(x$date), by = "1 day")) %>%
  ggplot(aes(date)) +
  geom_step(aes(y = rank_obs / nrow(x), color = "Obs")) +
  geom_point(aes(y = rank_pred / nrow(x), color = "Pred"), size = 1) +
  scale_color_brewer(NULL, palette = "Set1") +
  scale_x_date(date_labels = "%b %Y", date_breaks = "2 months", expand = expansion()) +
  scale_y_continuous(breaks = scales::pretty_breaks(n = 8), labels = scales::percent_format(accuracy = 1), expand = expansion()) +
  guides(
    color = guide_legend(override.aes = list(linetype = c(1, 0), size = c(0, 2), shape = c(0, 16)))
  ) +
  labs(
    x = "Date",
    y = "Percentile Rank",
    title = "Daily Timeseries of Observed and Predicted Ranks",
    subtitle = x_subtitle
  ) +
  theme_bw()

x_day %>%
  filter(
    date >= ymd(20220801),
    date < ymd(20221001)
  ) %>%
  ggplot(aes(date)) +
  geom_line(aes(y = rank_obs / nrow(x_day), color = "Obs")) +
  geom_point(aes(y = rank_pred / nrow(x_day), color = "Pred"), size = 1) +
  scale_color_brewer(NULL, palette = "Set1") +
  scale_x_date(date_labels = "%b %d, %Y", expand = expansion()) +
  scale_y_continuous(breaks = scales::pretty_breaks(n = 8), labels = scales::percent_format(accuracy = 1)) +
  guides(
    color = guide_legend(override.aes = list(linetype = c(1, 0), size = c(0, 2), shape = c(0, 16)))
  ) +
  labs(
    x = "Date",
    y = "Percentile Rank of Daily Mean Flow/Score",
    title = "Daily Timeseries of Observed and Predicted Ranks",
    subtitle = glue("Station: {x_site} | Period: 2022-08-01 to 2022-09-30")
  ) +
  theme_bw()

