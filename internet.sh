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
ICON_INFO="✔️"
ICON_DEBUG="🐞"
ICON_ERROR="❌"

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
    log_debug "Command: pgrep -f \"python3 $SCRIPT_PATH\" => Script is already running. Exiting."
    exit 0
fi

log_info "authen.py script isn't running. Checking network connection..."

# Check network connection and log output
NETWORK_CHECK=$(ip a | grep 'inet ' | grep -v '127.0.0.1' | grep '192.168.')
log_debug "Command: ip a | grep 'inet ' | grep -v '127.0.0.1' | grep '192.168.' => Output: $NETWORK_CHECK"

if [ -z "$NETWORK_CHECK" ]; then
    log_error "No network connection detected. Cannot determine internet access."
    exit 1
fi

log_info "First, trying Firefox portal detection..."

# Perform curl and log output
CURL_OUTPUT=$(curl -s --max-time 5 http://detectportal.firefox.com/success.txt)
log_debug "Command: curl -s --max-time 5 http://detectportal.firefox.com/success.txt => Output: $CURL_OUTPUT"

if echo "$CURL_OUTPUT" | grep -q "success"; then
    log_debug "Internet is available. Checking for potential redirection..."
    REDIRECT_CHECK=$(curl -s -L http://detectportal.firefox.com/success.txt | grep -i "<title>.*Authentication.*</title>")
    log_debug "Command: curl -s -L http://detectportal.firefox.com/success.txt | grep -i \"<title>.*Authentication.*</title>\" => Output: $REDIRECT_CHECK"
    
    if [ -n "$REDIRECT_CHECK" ]; then
        log_error "Redirected to an authentication page. Captive portal detected. Proceeding with authentication."
    else
        log_debug "No redirection detected. No need to authenticate. Exiting..."
        exit 0
    fi
else
    log_error "No success found in curl output. Output was: $CURL_OUTPUT"
fi

# If Firefox check fails, try pinging an external IP
PING_TEST=$(ping -c 2 8.8.8.8 2>&1)
log_debug "Command: ping -c 2 8.8.8.8 => Output: $PING_TEST"

if echo "$PING_TEST" | grep -q "bytes from"; then
    log_info "Network connection detected but no internet access. Likely a captive portal. Running authentication script..."
    nohup python3 "$SCRIPT_PATH" >> "$NOHUP_OUT" 2>> "$ERROR_LOG" &
    if [ $? -eq 0 ]; then
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
