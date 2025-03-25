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

healthStatus() {
    ip=${1:-localhost}
    port=${2:-3000}

    if [ -z "$ip" ]; then
        log "WARNING" "No IP provided, checking localhost"
        ip="localhost"
    fi

    log "INFO" "Checking server health status on http://${ip}:${port}/health?service=bash-script%20healthStatus%28%29"
    serverResponse=$(curl -s -m 10 "http://${ip}:${port}/health?service=bash-script%20healthStatus%28%29%20everyMin30th")
    log "DEBUG" "health check response: ${serverResponse}"

    if [ -z "$serverResponse" ]; then
        log "WARNING" "No response from /health endpoint, checking container status"
        dockerStatus=$(docker ps --filter "name=WealthTrack-prodContainer" --format "{{.Status}}")
        
        if [ -z "$dockerStatus" ]; then
            log "ERROR" "Container not found"
            return 1
        fi
        
        if echo "$dockerStatus" | grep -q "healthy"; then
            log "INFO" "Container is healthy: $dockerStatus"
            return 0
        else
            log "ERROR" "Container is not healthy: $dockerStatus"
            return 1
        fi
    else
        if echo "$serverResponse" | grep -q '"status":"healthy"'; then
            log "INFO" "Server is healthy"
            return 0
        else
            log "ERROR" "Server is not healthy: $serverResponse"
            return 1
        fi
    fi
}

restartDockerDaemon() {
    if [ "$(uname -s)" = "Linux" ]; then
        log "INFO" "\033[1;31mRestarting Docker daemon on Ubuntu...\033[0m"
        sudo systemctl restart docker
        sleepWithTimer 10
    elif [ "$(uname -s)" = "MINGW64_NT"* ]; then
        log "INFO" "Restarting Docker Desktop on Windows..."
        if tasklist | findstr "Docker Desktop.exe" > /dev/null 2>&1; then
            log "DEBUG" "Stopping Docker Desktop..."
            taskkill //IM "Docker Desktop.exe" //F > /dev/null 2>&1
            sleepWithTimer 5
        else
            log "WARNING" "Docker Desktop is not running."
        fi
        log "INFO" "Starting Docker Desktop..."
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        log "INFO" "Waiting for Docker Desktop to initialize..."
        sleepWithTimer 15
    else
        log "ERROR" "\033[1;31mUnsupported OS. Cannot restart Docker.\033[0m"
        exit 1
    fi

    log "INFO" "Waiting for Docker daemon to be ready..."
    until docker ps > /dev/null 2>&1; do
        log "DEBUG" "Waiting for Docker daemon..."
        sleep 5
        if ! docker info > /dev/null 2>&1; then
            log "ERROR" "\033[1;31mDocker daemon is not running\033[0m"
            exit 1
        fi
    done
    log "INFO" "Docker daemon is ready."
}

start_server() {
    log "INFO" "\033[7;34m>>>\033[0m verifying the current directory..."
    if [ "${PWD##*/}" != "WealthTracking" ]; then
        log "ERROR" "\033[1;31mPlease run this script from the WealthTracking directory.\033[0m"
        exit 1
    fi
    log "INFO" "\033[7;34m>>>\033[0m Stopping existing containers..."
    docker compose down --remove-orphans
    sleepWithTimer 5

    log "INFO" "\033[7;34m>>>\033[0m Starting Production server containers from built image..."
    # docker compose up -d --no-build
    docker compose -f docker-compose.prod.yml up -d --build
    
    log "INFO" "\033[7;34m>>>\033[0m Waiting for server to fully start..."
    sleepWithTimer 20

    retry_count=0
    max_retries=3

    while ! healthStatus; do
        log "DEBUG" "\033[7;34m>>>\033[0m Server is not responding."
        restartDockerDaemon
        log "DEBUG" "\033[7;34m>>>\033[0m Retrying server start..."
        retry_count=$((retry_count + 1))
        if [ $retry_count -ge $max_retries ]; then
            log "ERROR" "\033[1;33mExceeded maximum retries. Exiting...\033[0m"
            exit 1
        fi
        # Note: A recursive call here is not ideal; consider using a loop.
        start_server
        sleepWithTimer 10
    done

    log "INFO" "\033[1;36mServer is healthy!\033[0m"
}

setup_cronjobs() {
    # First, remove any existing entries to prevent duplicates
    (crontab -l 2>/dev/null | grep -v "start_server.sh") | crontab -

    # Add the cron job for start_server.sh with better error handling
    (crontab -l 2>/dev/null; echo "*/30 * * * * /bin/sh -c 'cd $(pwd) && if ! /bin/sh start_server.sh health; then /bin/sh start_server.sh start; fi'") | crontab -
    
    log "INFO" "\033[7;34m>>>\033[0m cronjob created."
}

# Main script execution
main() {
    case "$1" in
        "health")
            shift  # Remove first argument
            healthStatus "$@"  # Pass remaining arguments to healthStatus
            exit $?
            ;;
        "restart")
            restartDockerDaemon
            exit $?
            ;;
        "start" | "")
            start_server
            log "INFO" "\a"
            log "INFO" "\033[1;32m++++Server is ready to use!++++\033[0m"
            
            # Setup cron jobs only on Linux
            if [ "$(uname -s)" = "Linux" ]; then
                setup_cronjobs
            fi
            ;;
        *)
            log "ERROR" "Unknown command: $1"
            log "INFO" "Usage: $0 [health|restart|start]"
            exit 1
            ;;
    esac
}

# Call main with all arguments
main "$@"
