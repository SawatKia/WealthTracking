#!/bin/bash

# Script configuration
SCRIPT_PATH="/home/sawat/Auto-Authen-KMITL/authen.py"
LOG_FILE="/home/sawat/Auto-Authen-KMITL/authen.log"
NOHUP_OUT="/home/sawat/Auto-Authen-KMITL/nohup.out"
ERROR_LOG="/home/sawat/Auto-Authen-KMITL/error.log"
TZ="Asia/Bangkok"

# Colors for log levels
COLOR_INFO="\e[32m"   # Green for INFO
COLOR_DEBUG="\e[34m"  # Blue for DEBUG
COLOR_ERROR="\e[31m"  # Red for ERROR
COLOR_RESET="\e[0m"   # Reset color

# Unicode symbols for log emphasis
ICON_INFO="✔️"   # U+2705
ICON_DEBUG="🐞"  # U+1F41E
ICON_ERROR="❌"  # U+274C

# Function to get timestamp in Bangkok timezone
timestamp() {
    date +"%d/%m/%Y %H:%M:%S.%N"
}

# Logging functions
log_info() {
    echo -e "${COLOR_INFO}[$(timestamp)] [INFO] ${ICON_INFO} $1${COLOR_RESET}"
    echo "[$(timestamp)] [INFO] ${ICON_INFO} $1" >> "$LOG_FILE"
}

log_debug() {
    echo -e "${COLOR_DEBUG}[$(timestamp)] [DEBUG] ${ICON_DEBUG} $1${COLOR_RESET}"
    echo "[$(timestamp)] [DEBUG] ${ICON_DEBUG} $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${COLOR_ERROR}[$(timestamp)] [ERROR] ${ICON_ERROR} $1${COLOR_RESET}"
    echo "[$(timestamp)] [ERROR] ${ICON_ERROR} $1" | tee -a "$LOG_FILE" "$ERROR_LOG" >&2
}

# Trap errors and log them
trap 'log_error "Unexpected error at line $LINENO. Exit code: $?"' ERR

# Start script execution
log_info "Checking if authentication script is already running..."

# Check if the script is already running
if pgrep -f "python3 $SCRIPT_PATH" > /dev/null; then
    log_debug "Script is already running, exiting..."
    exit 0
fi

log_info "authen.py script isn't running, Checking network connection..."

# Check if the device has an IP assigned (connected to a network)
if ! ip a | grep 'inet ' | grep -v '127.0.0.1' | grep '192.168.'; then
    log_error "No network connection detected. Cannot determine internet access."
    exit 1
fi

log_info "Network detected. Checking internet connectivity..."

# First, try Firefox portal detection
if curl -s --max-time 5 http://detectportal.firefox.com/success.txt | grep -q "success"; then
    log_debug "Internet is available. No need to run authentication script, exiting..."
    exit 0
fi

# If Firefox check fails, try pinging an external IP
if ping -c 2 8.8.8.8 > /dev/null 2>&1; then
    log_info "Network connection detected but no internet access. Likely a captive portal. Running authentication script..."
    if nohup python3 "$SCRIPT_PATH" >> "$NOHUP_OUT" 2>> "$ERROR_LOG" & then
        log_info "Auto-authentication script started successfully."
    else
        log_error "Failed to start authentication script."
        exit 1
    fi
else
    log_error "No network connectivity detected. Cannot proceed."
    exit 1
fi

exit 0
