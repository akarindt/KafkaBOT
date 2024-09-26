#!/bin/sh

# Check if the backup directory exists
if [ -d "./backup" ]; then
    # Change to backup directory
    cd ./backup

    # Start migrations
    npm run typeorm migration:run -- -d ./src/helper/datasource.ts

    # Remove unused files
    cd ../
    rm -rf ./backup
fi

# Start project
npm run start:prod