# health_check.sh - Server health monitoring
#!/bin/bash
source ./utils.sh

# List of required containers and their expected states
readonly REQUIRED_CONTAINERS=(
    "WealthTrack-prodContainer"
    "redis-prodContainer"
    "postgres-prodContainer"
)

check_container_health() {
    local container_name=$1
    local container_status
    
    container_status=$(docker ps --filter "name=$container_name" --format "{{.Status}}")
    
    if [ -z "$container_status" ]; then
        log_error "Container $container_name is not running"
        return 1
    fi
    
    if ! echo "$container_status" | grep -q "(healthy)"; then
        log_error "Container $container_name is running but not healthy: $container_status"
        return 1
    fi
    
    log_status "Container \033[1;32m$container_name\033[0m is healthy: $container_status"
    return 0
}

check_all_containers() {
    local all_healthy=true
    
    for container in "${REQUIRED_CONTAINERS[@]}"; do
        if ! check_container_health "$container"; then
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log_success "All required containers are healthy"
        return 0
    else
        log_error "Some containers are unhealthy"
        return 1
    fi
}

check_server_health() {
    local ip=${1:-localhost}
    local port
    
    if [ -z "$ip" ]; then
        log_info "No IP provided, assuming healthy."
        return 0
    fi
    
    # Set port based on IP address
    if [ "$ip" = "localhost" ]; then
        port=3000
    else
        # For IPv4, don't specify port as nginx handles routing
        port=""
    fi
    
    local health_url
    if [ -n "$port" ]; then
        health_url="http://${ip}:${port}/health"
    else
        health_url="http://${ip}/health"
    fi
    health_url+="?service=cronjob check_server_health"
    
    log_info "Checking server health status on ${health_url}..."
    local serverResponse=$(curl -s "${health_url}")
    
    if [ -z "$serverResponse" ]; then
        log_info "No response from /health endpoint, checking container health..."
        return $(check_all_containers)
    else
        echo -e "Server healthy response: $serverResponse"
        if echo "$serverResponse" | grep -q '"status":"healthy"'; then
            log_success "Server is healthy."
            return 0
        fi
        return 1
    fi
}