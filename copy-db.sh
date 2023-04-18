#!/bin/bash
# Copies db models to API folder

rsync -av --delete ./db/models api/db/
rsync -av --delete ./db/models batch/processor/
