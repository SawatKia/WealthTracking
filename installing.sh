#!/bin/bash

if [ "${PWD##*/}" != "WealthTracking" ]; then
    echo -e "\033[1;31m>>> Please run this script from the WealthTracking directory.\033[0m"
    exit 1
fi

cd ./backend/V0.2/
echo -e "\033[7;34m>>>\033[0m installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "\033[1;31mFailed to install backend dependencies. Exiting...\033[0m"
    exit 1
fi
cd ../..

# echo -e "\033[7;34m>>>\033[0m Building Docker images..."
# set -a
# source ./.env
# set +a
# docker compose -f docker-compose.yml build --no-cache
