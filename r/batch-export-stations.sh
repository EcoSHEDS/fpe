#!/bin/bash
# batch export stations
# usage: ./batch-export-stations.sh <sites file> <root output path>
# example: ./batch-export-stations.sh /d/fpe/sites/sites.txt /d/fpe/sites

set -eu

while read CODE ID; do
  echo $CODE $ID
  Rscript src/export-station.R $ID $2/$CODE/data
done < $1
