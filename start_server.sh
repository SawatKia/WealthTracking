#!/bin/bash

source ./logging.sh

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
        log "INFO" "No IP provided, assuming healthy."
        return 0
    fi

    log "INFO" "Checking server health status on http://${ip}:${port}/health"
    serverResponse=$(curl -s -m 10 http://${ip}:${port}/health?service=bash-script)

    if [ -z "$serverResponse" ]; then
        log "WARNING" "No response from /health endpoint, falling back to docker ps check"
        dockerStatus=$(docker ps --filter "name=WealthTrack-prodContainer" --format "{{.Status}}")
        if [ "$dockerStatus" != "healthy" ]; then
            log "INFO" "WealthTrack-prodContainer status: $dockerStatus"
            return 0
        else
            log "ERROR" "Container is not healthy"
            return 1
        fi
    else
        log "INFO" "Server health response: $serverResponse"
        log "DEBUG" "$serverResponse" | grep -q '"status":"healthy"'
        return $?
    fi
}

# ...rest of the file using log function instead of echo -e...

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
    sleepWithTimer 10

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

start_server
log "INFO" "\a"
log "INFO" "\033[1;32m++++Server is ready to use!++++\033[0m"

# (Optional) Create a cronjob for Ubuntu (staging/production)
if [ "$(uname -s)" = "Linux" ]; then

    # First, remove any existing entries to prevent duplicates
    (crontab -l 2>/dev/null | grep -v "start_server.sh" \
                           | grep -v "update-nginx-blacklist.sh" \
                           | grep -v "internet.sh" \
                           | grep -v "auto-authen.sh") | crontab -

    # Add all cron jobs at once
    (crontab -l 2>/dev/null; echo "15 */1 * * * /bin/sh -c 'if ! /bin/sh $(pwd)/start_server.sh healthStatus; then /bin/sh $(pwd)/start_server.sh; fi'
*/5 * * * * /bin/sh $(pwd)/update-nginx-blacklist.sh
*/20 * * * * /bin/sh $(pwd)/internet.sh") | crontab -
    
    log "INFO" "\033[7;34m>>>\033[0m cronjob created."
fi
log "INFO" "Starting server script completed."
exit 0
