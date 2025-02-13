#!/bin/bash

sleepWithTimer() {
    for i in $(seq $1 -1 1); do
        printf "\r\033[34mCountdown: %2d\033[0m   " "$i"
        sleep 1
    done
    echo -e "\nDone!"
}

healthStatus() {
    ip=${1:-localhost}
    port=${2:-3000}

    if [ -z "$ip" ]; then
        echo "\033[1;34m>>>\033[0m No IP provided, assuming healthy."
        return 0
    fi
    
    echo "\033[1;34m>>>\033[0m Checking server health status on http://${ip}:${port}/health..."
    serverResponse=$(curl -s http://${ip}:${port}/health)

    if [ -z "$serverResponse" ]; then
        echo "\033[1;34m>>>\033[0m No response from /health endpoint, falling back to docker ps check..."
        # Check if the container "node-container" is running
        dockerStatus=$(docker ps --filter "name=node-container" --format "{{.Status}}")
        if [ -n "$dockerStatus" ]; then
            echo "nodde-container status: $dockerStatus"
            return 0
        else
            echo "\033[1;31mContainer is not running.\033[0m"
            return 1
        fi
    else
        echo "Server healthy response: $serverResponse"
        echo "$serverResponse" | grep -q '"status":"healthy"'
        return $?
    fi
}

restartDockerDaemon() {
    if [[ "$(uname -s)" == "Linux" ]]; then
        echo "\033[1;31mRestarting Docker daemon on Ubuntu...\033[0m"
        systemctl restart docker
        sleepWithTimer 10
    elif [[ "$(uname -s)" == "MINGW64_NT"* ]]; then
        echo "Restarting Docker Desktop on Windows..."
        if tasklist | findstr "Docker Desktop.exe" > /dev/null 2>&1; then
            echo "Stopping Docker Desktop..."
            taskkill //IM "Docker Desktop.exe" //F > /dev/null 2>&1
            sleepWithTimer 5
        else
            echo "Docker Desktop is not running."
        fi
        echo "Starting Docker Desktop..."
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo "Waiting for Docker Desktop to initialize..."
        sleepWithTimer 15
    else
        echo "\033[1;31mUnsupported OS. Cannot restart Docker.\033[0m"
        exit 1
    fi

    echo "Waiting for Docker daemon to be ready..."
    until docker ps > /dev/null 2>&1; do
        echo "Waiting for Docker daemon..."
        sleep 5
        if ! docker info > /dev/null 2>&1; then
            echo "Docker daemon is not running"
            exit 1
        fi
    done
    echo "Docker daemon is ready."
}

start_server() {
    echo "\033[1;34m>>>\033[0m verifying the current directory..."
    if [ "${PWD##*/}" != "WealthTracking" ]; then
        echo "\033[1;34m>>>\033[0m Please run this script from the WealthTracking directory."
        exit 1
    fi
    echo "\033[1;34m>>>\033[0m Stopping existing containers..."
    docker compose down
    sleepWithTimer 5

    echo "\033[1;34m>>>\033[0m Starting Production server containers from built image..."
    docker compose -f docker-compose.prod.yml up -d --no-build

    echo "\033[1;34m>>>\033[0m Waiting for server to fully start..."
    sleepWithTimer 10

    retry_count=0
    max_retries=1

    while ! healthStatus; do
        echo "\033[1;34m>>>\033[0m Server is not responding."
        restartDockerDaemon
        echo "\033[1;34m>>>\033[0m Retrying server start..."
        retry_count=$((retry_count + 1))
        if [ $retry_count -ge $max_retries ]; then
            echo "Exceeded maximum retries. Exiting..."
            exit 1
        fi
        # Note: A recursive call here is not ideal; consider using a loop.
        start_server
        sleepWithTimer 10
    done

    echo "Server is healthy!"
}

start_server
echo -e "\a"
echo -e "\033[1;36m++++Server is ready to use!++++\033[0m"

# (Optional) Create a cronjob for Ubuntu (staging/production)
if [[ "$(uname -s)" == "Linux" ]]; then
    project_root=$(pwd)
    # (crontab -l 2>/dev/null; echo "*/5 * * * * /bin/bash -c 'if ! $project_root/start_server.sh healthStatus; then $project_root/start_server.sh; fi'") | crontab -
    (crontab -l 2>/dev/null; echo "1 */1 * * * /bin/bash -c 'if ! $project_root/start_server.sh healthStatus; then $project_root/start_server.sh; fi'") | crontab -
    echo "\033[1;34m>>>\033[0m cronjob created."
fi
