# docker_management.sh - Docker-related operations
#!/bin/bash
source ./utils.sh

restart_docker_daemon() {
    if [ "$(uname -s)" = "Linux" ]; then
        log_info "Restarting Docker daemon on Ubuntu..."
        systemctl restart docker
        countdown_timer 10
    elif [ "$(uname -s)" = "MINGW64_NT"* ]; then
        log_info "Restarting Docker Desktop on Windows..."
        if tasklist | findstr "Docker Desktop.exe" > /dev/null 2>&1; then
            log_info "Stopping Docker Desktop..."
            taskkill //IM "Docker Desktop.exe" //F > /dev/null 2>&1
            countdown_timer 5
        fi
        log_info "Starting Docker Desktop..."
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        log_info "Waiting for Docker Desktop to initialize..."
        countdown_timer 15
    else
        log_error "Unsupported OS. Cannot restart Docker."
        exit 1
    fi

    log_info "Waiting for Docker daemon to be ready..."
    until docker ps > /dev/null 2>&1; do
        log_info "Waiting for Docker daemon..."
        sleep 5
        if ! docker info > /dev/null 2>&1; then
            log_error "Docker daemon is not running"
            exit 1
        fi
    done
    log_success "Docker daemon is ready."
}

setup_cronjob() {
    if [ "$(uname -s)" = "Linux" ]; then
        log_info "Setting up health check cronjob..."
        (crontab -l 2>/dev/null | grep -v "start_server.sh" ; echo "*/5 * * * * /bin/sh -c 'if ! /bin/sh $(pwd)/start_server.sh check_health; then /bin/sh $(pwd)/start_server.sh; fi'") | crontab -
        log_success "Cronjob created successfully."
    fi
}