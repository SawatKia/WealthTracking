# docker_management.sh - Docker-related operations
#!/bin/bash
source ./utils.sh

restart_docker_daemon() {
    if [ "$(uname -s)" = "Linux" ]; then
        log_error "Restarting Docker daemon on Ubuntu..."
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
        log_info "Setting up health check cronjobs..."
        
        # Create a temporary file for the new crontab
        local temp_crontab=$(mktemp)
        
        # Get existing crontab without our managed entries
        crontab -l 2>/dev/null | grep -v "WealthTracking monitoring" | \
            grep -v "start_server.sh" | \
            grep -v "deploy.sh" > "$temp_crontab" || true
        
        # Add our health check crontabs
        {
            echo "# WealthTracking monitoring - Added $(date)"
            # Check every hours at minute 15th, restart if main server health check fails
            echo "15 */1 * * * cd $(pwd) && /bin/sh -c 'if ! ./start_server.sh check-health; then ./start_server.sh; fi'"
            # Every hour, check all containers and do full redeploy if any are unhealthy
            echo "0 * * * * cd $(pwd) && /bin/sh -c 'if ! ./start_server.sh check-all; then ./deploy.sh; fi'"
        } >> "$temp_crontab"
        
        # Install the new crontab
        crontab "$temp_crontab"
        rm "$temp_crontab"
        
        log_success "Cronjobs created successfully:"
        log_info "  - Main server health check every 5 minutes with container restart"
        log_info "  - Full containers health check every hour with redeploy if needed"
    fi
}