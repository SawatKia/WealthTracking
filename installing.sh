#!/bin/bash

# Common logging function that works in both GitHub Actions and shell
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # If running in GitHub Actions
    if [ -n "$GITHUB_ACTIONS" ]; then
        case $level in
            "INFO")    echo "::info::$timestamp - $message" ;;
            "WARNING") echo "::warning::$timestamp - $message" ;;
            "ERROR")   echo "::error::$timestamp - $message" ;;
            "DEBUG")   echo "::debug::$timestamp - $message" ;;
            "GROUP")   echo "::group::$timestamp - $message" ;;
            "ENDGROUP") echo "::endgroup::" ;;
            *)        echo "$timestamp - $message" ;;
        esac
    else
        # Regular shell output with colors
        case $level in
            "INFO")    echo -e "\033[0;32m$timestamp - INFO - $message\033[0m" ;;
            "WARNING") echo -e "\033[0;33m$timestamp - WARNING - $message\033[0m" ;;
            "ERROR")   echo -e "\033[0;31m$timestamp - ERROR - $message\033[0m" ;;
            "DEBUG")   echo -e "\033[0;34m$timestamp - DEBUG - $message\033[0m" ;;
            *)        echo -e "$timestamp - $message" ;;
        esac
    fi
}

if [ "${PWD##*/}" != "WealthTracking" ]; then
    log "ERROR" "\033[1;31m>>> Please run this script from the WealthTracking directory.\033[0m"
    exit 1
fi

cd ./backend/V0.2/

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    log "ERROR" "\033[1;31mnpm is not installed. Please install npm and try again.\033[0m"
    exit 1
fi

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
