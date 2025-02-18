# health_check.sh - Server health monitoring
#!/bin/bash
source ./utils.sh

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
    
    log_info "Checking server health status on ${health_url}..."
    local serverResponse=$(curl -s "http://${ip}:${port}/health")
    
    if [ -z "$serverResponse" ]; then
        log_info "No response from /health endpoint, falling back to docker ps check..."
        local dockerStatus=$(docker ps --filter "name=WealthTrack-prodContainer" --format "{{.Status}}")
        
        if [ -n "$dockerStatus" ]; then
            log_status "WealthTrack-prodContainer status: $dockerStatus"
            return 0
        else
            log_error "Container is not running."
            return 1
        fi
    else
        echo -e "Server healthy response: $serverResponse"
        if echo "$serverResponse" | grep -q '"status":"healthy"'; then
            log_success "Server is healthy."
            return 0
        fi
        return 1
    fi
}