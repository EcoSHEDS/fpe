library(dataRetrieval)
library(tidyverse)
library(lubridate)

df_dv_nwis <- dataRetrieval::readNWISdv(siteNumbers = "01059000", parameterCd = "00060", startDate = "2019-10-01", endDate = "2020-09-30")
df_dv <- df_dv_nwis %>% 
  select(date = Date, flow_cfs = X_00060_00003)
df_dv %>% 
  write_csv("../androscoggin-day-year.csv")

df_uv_yr_nwis <- dataRetrieval::readNWISuv(siteNumbers = "01059000", parameterCd = "00060", startDate = "2019-10-01", endDate = "2020-09-30")
df_uv_yr <- df_uv_yr_nwis %>% 
  select(datetime = dateTime, flow_cfs = X_00060_00000) %>% 
  mutate(datetime = with_tz(datetime, tzone = "US/Eastern"))
df_uv_yr %>% 
  write_csv("../androscoggin-15min-year.csv")

df_uv_mon <- df_uv_yr %>% 
  filter(datetime >= ymd_hm("2020-09-01 00:00", tz = "US/Eastern"))
df_uv_mon %>% 
  write_csv("../androscoggin-15min-month.csv")
