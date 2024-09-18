#!/bin/sh

# Change to backup directory
cd ./backup

# Start migrations
npm run typeorm migration:run -- -d ./src/helper/datasource.ts

# Remove unused files
cd ../
rm -rf ./backup

# Start project
npm run start:prod