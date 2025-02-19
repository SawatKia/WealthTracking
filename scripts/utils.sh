# utils.sh - Common utilities and logging functions
#!/bin/bash

# Constants for ANSI color codes
readonly RED='\033[1;31m'
readonly GREEN='\033[1;32m'
readonly BLUE='\033[1;34m'
readonly CYAN='\033[1;36m'
readonly MARKER='\033[7;34m'
readonly NC='\033[0m' # No Color

log_info() {
    echo -e "${MARKER}>>>${NC} $1"
}

log_success() {
    echo -e "${GREEN}$1${NC}"
}

log_error() {
    echo -e "${RED}$1${NC}"
}

log_status() {
    echo -e "${CYAN}$1${NC}"
}

verify_directory() {
    if [ "${PWD##*/}" != "WealthTracking" ]; then
        log_error "Please run this script from the WealthTracking directory."
        exit 1
    fi
}

countdown_timer() {
    local seconds=$1
    for i in $(seq $seconds -1 1); do
        printf "\r${BLUE}Countdown: %2d${NC}   " "$i"
        sleep 1
    done
    echo -e "\n"
}