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

sleepWithTimer() {
    for i in $(seq $1 -1 1); do
        log "DEBUG" "Countdown: $i seconds remaining"
        sleep 1
    done
}

# Modified script with GitHub Actions logging
log "INFO" "Verifying the current directory..."
if [ "${PWD##*/}" != "WealthTracking" ]; then
    log "ERROR" "Please run this script from the WealthTracking directory."
    exit 1
fi

log "INFO" "Pulling git repo..."
git restore .
log "INFO" "Git repo restored!"
git pull origin main --recurse-submodules
if [ $? -ne 0 ]; then
    log "ERROR" "Failed to pull git repo."
    exit 1
fi
sleepWithTimer 3
log "INFO" "Git repo pulling completed!"

if [ ! -f "./start_server.sh" ]; then
    log "ERROR" "Files installing.sh and start_server.sh do not exist."
    exit 1
fi

log "INFO" "Starting server containers process..."
sh ./start_server.sh $1 $2