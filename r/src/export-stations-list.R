# export stations list
# usage: Rscript export-stations-list.R <output file>

Sys.setenv(TZ = "GMT")

library(tidyverse)
library(lubridate)
library(logger)
library(glue)

if (interactive()) {
  output_file <- file.choose(new = TRUE)
} else {
  args <- commandArgs(trailingOnly = TRUE)
  output_file <- args[1]
}

log_info("output_file: {output_file}")

config <- config::get()

con <- DBI::dbConnect(
  RPostgres::Postgres(),
  host = config$db$host,
  port = config$db$port,
  dbname = config$db$database,
  user = config$db$user,
  password = config$db$password
)

stations <- DBI::dbGetQuery(con, "select u.affiliation_code, s.id, s.name, s.description, s.latitude, s.longitude, s.private, s.created_at from stations s left join users u on s.user_id=u.id") %>%
  as_tibble()

stations %>%
  filter(affiliation_code != "ADMIN") %>%
  write_csv(output_file, na = "")
