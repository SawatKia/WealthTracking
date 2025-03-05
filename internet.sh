#!/bin/bash

# Exit on any error and prevent unbound variables
set -euo pipefail

# Script configuration
LOG_DIR="/home/sawat/Auto-Authen-KMITL"
SCRIPT_PATH="${LOG_DIR}/authen.py"
LOG_FILE="${LOG_DIR}/authen.log"
NOHUP_OUT="${LOG_DIR}/nohup.out"
ERROR_LOG="${LOG_DIR}/error.log"
TZ="Asia/Bangkok"

# Colors for log levels
COLOR_INFO="\e[32m"   # Green for INFO
COLOR_DEBUG="\e[34m"  # Blue for DEBUG
COLOR_ERROR="\e[31m"  # Red for ERROR
COLOR_WHITE="\e[97m"  # White for output
COLOR_RESET="\e[0m"   # Reset color

# Unicode symbols for log emphasis
ICON_INFO="✔️"   # U+2705
ICON_DEBUG="🐞"  # U+1F41E
ICON_ERROR="❌"  # U+274C

# Function to ensure log directory exists
ensure_log_directory() {
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR" || {
            echo "Failed to create log directory: $LOG_DIR"
            exit 1
        }
    fi
    log_info "Log directory: \"$LOG_DIR\" exists."
}

# Check required commands
check_dependencies() {
    local missing_deps=()
    local cmds=("curl" "grep" "ping" "python3" "pkill")
    for cmd in "${cmds[@]}"; do
        if ! command -v $cmd >/dev/null 2>&1; then
            missing_deps+=($cmd)
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required commands: ${missing_deps[*]}"
        exit 1
    fi
    
    log_info "All required commands are installed."
}

# Enhanced error handling with cleanup
cleanup() {
    # Kill any running authentication processes if script exits
    pkill -f "python3 $SCRIPT_PATH" >/dev/null 2>&1 || true
}

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

# Modified error handler for better error reporting
handle_error() {
    local exit_code=$?
    local line_no=$1
    
    # Disable error exit for error handling
    set +e
    
    # Clear any previous error message
    echo -e "${COLOR_ERROR}[$(timestamp)] [ERROR] ${ICON_ERROR} Script failed at line ${line_no}${COLOR_RESET}" >&2
    
    case $exit_code in
        1)
            if [[ $line_no -eq 31 ]]; then
                echo -e "${COLOR_ERROR}[$(timestamp)] [ERROR] ${ICON_ERROR} Permission denied: Cannot create directory structure${COLOR_RESET}" >&2
            fi
            ;;
        126)
            echo -e "${COLOR_ERROR}[$(timestamp)] [ERROR] ${ICON_ERROR} Command invoked cannot execute${COLOR_RESET}" >&2
            ;;
        127)
            echo -e "${COLOR_ERROR}[$(timestamp)] [ERROR] ${ICON_ERROR} Command not found${COLOR_RESET}" >&2
            ;;
        *)
            echo -e "${COLOR_ERROR}[$(timestamp)] [ERROR] ${ICON_ERROR} Unknown error occurred${COLOR_RESET}" >&2
            ;;
    esac
    
    # Ensure cleanup is called
    cleanup
    
    # Exit with the original error code
    exit $exit_code
}

# Modified trap to use the new error handler
trap 'handle_error ${LINENO}' ERR
trap cleanup EXIT

# Trap errors and log them
# trap 'log_error "Unexpected error at line $LINENO. Exit code: $?"' ERR

main(){
    ensure_log_directory
    check_dependencies

    # Start script execution
    log_info "Checking if authentication script is already running..."

    # Check if script exists
    if [ ! -f "$SCRIPT_PATH" ]; then
        log_error "Authentication script not found at: $SCRIPT_PATH"
        exit 1
    fi

    # Check if the script is already running
    if pgrep -f "python3 $SCRIPT_PATH" > /dev/null; then
        log_debug "Command: pgrep -f \"python3 $SCRIPT_PATH\" => Script is already running. Exiting."
        exit 0
    fi

    log_info "authen.py script isn't running. Checking network connection..."

    # Check network connection and log output
    NETWORK_CHECK=$(ip a | grep 'inet ' | grep -v '127.0.0.1' | grep '192.168.')
    log_debug "Command: ip a | grep 'inet ' | grep -v '127.0.0.1' | grep '192.168.' => Output: ${COLOR_WHITE}${NETWORK_CHECK}${COLOR_RESET}"

    if [ -z "$NETWORK_CHECK" ]; then
        log_error "No network connection detected. Cannot determine internet access."
        exit 1
    fi

    log_info "First, trying Firefox portal detection..."

    # Perform curl and log output
    CURL_OUTPUT=$(curl -s --max-time 5 http://detectportal.firefox.com/success.txt)
    log_debug "Command: curl -s --max-time 5 http://detectportal.firefox.com/success.txt => Output: ${COLOR_WHITE}${CURL_OUTPUT}${COLOR_RESET}"

    if echo "$CURL_OUTPUT" | grep -q "success"; then
        log_debug "Internet is available. Checking for potential redirection..."
        REDIRECT_OUTPUT=$(curl -s -L http://detectportal.firefox.com/success.txt)
        log_debug "Command: curl -s -L http://detectportal.firefox.com/success.txt => Output: ${COLOR_WHITE}${REDIRECT_OUTPUT}${COLOR_RESET}"
        REDIRECT_CHECK=$(echo "$REDIRECT_OUTPUT" | grep -i "<title>.*Authentication.*</title>")
        log_debug "Command: echo \"\$REDIRECT_OUTPUT\" | grep -i \"<title>.*Authentication.*</title>\" => Output: ${COLOR_WHITE}${REDIRECT_CHECK}${COLOR_RESET}"
        
        if [ -n "$REDIRECT_CHECK" ]; then
            log_error "Redirected to an authentication page. Captive portal detected. Proceeding with authentication."
        else
            log_debug "No redirection detected. No need to authenticate. Exiting..."
            exit 0
        fi
    else
        log_error "No success found in curl output. Output was: ${COLOR_WHITE}${CURL_OUTPUT}${COLOR_RESET}"
    fi

    # If Firefox check fails, try pinging an external IP
    PING_TEST=$(ping -c 2 8.8.8.8 2>&1)
    log_debug "Command: ping -c 2 8.8.8.8 => Output: ${COLOR_WHITE}${PING_TEST}${COLOR_RESET}"

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
}
# Run main function
main
