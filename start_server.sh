#!/bin/bash

sleepWithTimer() {
    for i in $(seq $1 -1 1); do
        printf "\r\033[34mCountdown: %2d\033[0m   " "$i"
        sleep 1
    done
    echo -e "\n"
}

healthStatus() {
    ip=${1:-localhost}
    port=${2:-3000}

    if [ -z "$ip" ]; then
        echo -e "\033[7;34m>>>\033[0m No IP provided, assuming healthy."
        return 0
    fi

    echo -e "\033[7;34m>>>\033[0m Checking server health status on http://${ip}:${port}/health?service=cronjob healthStatus()..."
    serverResponse=$(curl -s http://${ip}:${port}/health?service=cronjob healthStatus)

    if [ -z "$serverResponse" ]; then
        echo -e "\033[7;34m>>>\033[0m No response from /health endpoint, falling back to docker ps check..."
        # Check if the container "WealthTrack-prodContainer" is running
        dockerStatus=$(docker ps --filter "name=WealthTrack-prodContainer" --format "{{.Status}}")
        if [ -n "$dockerStatus" ]; then
            echo -e "\033[1;36mWealthTrack-prodContainer status: $dockerStatus\033[0m"
            return 0
        else
            echo -e "\033[1;31mContainer is not running.\033[0m"
            return 1
        fi
    else
        echo -e "Server healthy response: $serverResponse"
        echo -e "$serverResponse" | grep -q '"status":"healthy"'
        return $?
    fi
}

restartDockerDaemon() {
    if [ "$(uname -s)" = "Linux" ]; then
        echo -e "\033[1;31mRestarting Docker daemon on Ubuntu...\033[0m"
        sudo systemctl restart docker
        sleepWithTimer 10
    elif [ "$(uname -s)" = "MINGW64_NT"* ]; then
        echo -e "Restarting Docker Desktop on Windows..."
        if tasklist | findstr "Docker Desktop.exe" > /dev/null 2>&1; then
            echo -e "Stopping Docker Desktop..."
            taskkill //IM "Docker Desktop.exe" //F > /dev/null 2>&1
            sleepWithTimer 5
        else
            echo -e "Docker Desktop is not running."
        fi
        echo -e "Starting Docker Desktop..."
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo -e "Waiting for Docker Desktop to initialize..."
        sleepWithTimer 15
    else
        echo -e "\033[1;31mUnsupported OS. Cannot restart Docker.\033[0m"
        exit 1
    fi

    echo -e "Waiting for Docker daemon to be ready..."
    until docker ps > /dev/null 2>&1; do
        echo -e "Waiting for Docker daemon..."
        sleep 5
        if ! docker info > /dev/null 2>&1; then
            echo -e "\033[1;31mDocker daemon is not running\033[0m"
            exit 1
        fi
    done
    echo -e "Docker daemon is ready."
}

start_server() {
    echo -e "\033[7;34m>>>\033[0m verifying the current directory..."
    if [ "${PWD##*/}" != "WealthTracking" ]; then
        echo -e "\033[1;31mPlease run this script from the WealthTracking directory.\033[0m"
        exit 1
    fi
    echo -e "\033[7;34m>>>\033[0m Stopping existing containers..."
    docker compose down
    sleepWithTimer 5

    echo -e "\033[7;34m>>>\033[0m Starting Production server containers from built image..."
    docker compose -f docker-compose.prod.yml up -d --no-build

    echo -e "\033[7;34m>>>\033[0m Waiting for server to fully start..."
    sleepWithTimer 10

    retry_count=0
    max_retries=3

    while ! healthStatus; do
        echo -e "\033[7;34m>>>\033[0m Server is not responding."
        restartDockerDaemon
        echo -e "\033[7;34m>>>\033[0m Retrying server start..."
        retry_count=$((retry_count + 1))
        if [ $retry_count -ge $max_retries ]; then
            echo -e "\033[1;33mExceeded maximum retries. Exiting...\033[0m"
            exit 1
        fi
        # Note: A recursive call here is not ideal; consider using a loop.
        start_server
        sleepWithTimer 10
    done

    echo -e "\033[1;36mServer is healthy!\033[0m"
}

start_server
echo -e "\a"
echo -e "\033[1;32m++++Server is ready to use!++++\033[0m"

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
    
    echo -e "\033[7;34m>>>\033[0m cronjob created."
fi
echo "Starting server script completed."
exit 0
