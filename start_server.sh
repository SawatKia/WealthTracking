#!/bin/bash

sleepWithTimer() {
    for i in $(seq $1 -1 1); do
        printf "\r\033[34mCountdown: %2d\033[0m   " "$i"
        sleep 1
    done
    echo -e "\nDone!"
}

healthStatus() {
    # Use APP_PORT if defined, default to 3000 otherwise.
    port=${APP_PORT:-3000}
    echo "Checking server health status on port ${port}..."
    serverResponse=$(curl -s http://localhost:${port}/health)
    echo "Server healthy response: $serverResponse"
    
    echo "$serverResponse" | grep -q '"status":"healthy"'
}

restartDockerDaemon() {
    if [[ "$(uname -s)" == "Linux" ]]; then
        echo "Restarting Docker daemon on Ubuntu..."
        sudo systemctl restart docker
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
        echo "Unsupported OS. Cannot restart Docker."
        exit 1
    fi

    echo "Waiting for Docker daemon to be ready..."
    until docker ps > /dev/null 2>&1; do
        echo "Waiting for Docker daemon..."
        sleep 2
    done
    echo "Docker daemon is ready."
}

start_server() {
    echo "Stopping existing containers..."
    docker compose down
    sleepWithTimer 5

    echo "Starting server containers from built image..."
    if [ "$NODE_ENV" = "production" ]; then
        docker compose -f docker-compose.prod.yml up -d --no-build
    else
        docker compose up -d --no-build
    fi

    echo "Waiting for server to start..."
    sleepWithTimer 10

    retry_count=0
    max_retries=5

    while ! healthStatus; do
        echo "Server is not responding."
        restartDockerDaemon
        echo "Retrying server start..."
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
echo -e "\033[1;36mServer is ready to use!\033[0m"

# (Optional) Create a cronjob for Ubuntu (staging/production)
if [[ "$(uname -s)" == "Linux" ]]; then
    project_root=$(pwd)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /bin/bash -c 'if ! $project_root/start_server.sh healthStatus; then $project_root/start_server.sh; fi'") | crontab -
fi
