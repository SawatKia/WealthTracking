#!/bin/bash

Function to log messages with timestamps and proper formatting for GitHub Actions
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
        *)
            echo "$timestamp - $message"
            ;;
    esac
}

# Modified sleep timer with GitHub Actions friendly output
sleepWithTimer() {
    for i in $(seq $1 -1 1); do
        echo "::debug::Countdown: $i seconds remaining"
        sleep 1
    done
    echo ""
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

if [ ! -f "./installing.sh" ] || [ ! -f "./start_server.sh" ]; then
    log "ERROR" "Files installing.sh and start_server.sh do not exist."
    exit 1
fi

log "INFO" "Installing dependencies..."
./installing.sh
if [ $? -ne 0 ]; then
    log "ERROR" "Failed to install dependencies."
    exit 1
fi

log "INFO" "Installed dependencies process complete!"

log "INFO" "Starting server containers process..."
./start_server.sh $1 $2