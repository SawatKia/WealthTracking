#!/bin/bash

# Common logging function for GitHub Actions
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo "::info::$timestamp - $message"
            ;;
        "WARNING")
            echo "::warning::$timestamp - $message"
            ;;
        "ERROR")
            echo "::error::$timestamp - $message"
            ;;
        "DEBUG")
            echo "::debug::$timestamp - $message"
            ;;
        "GROUP")
            echo "::group::$timestamp - $message"
            ;;
        "ENDGROUP")
            echo "::endgroup::"
            ;;
        *)
            echo "$timestamp - $message"
            ;;
    esac
}

if [ "${PWD##*/}" != "WealthTracking" ]; then
    log "ERROR" "\033[1;31m>>> Please run this script from the WealthTracking directory.\033[0m"
    exit 1
fi

cd ./backend/V0.2/
log "INFO" "\033[7;34m>>>\033[0m installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    log "ERROR" "\033[1;31mFailed to install backend dependencies. Exiting...\033[0m"
    exit 1
fi
cd ../..

# echo -e "\033[7;34m>>>\033[0m Building Docker images..."
# set -a
# source ./.env
# set +a
# docker compose -f docker-compose.yml build --no-cache
