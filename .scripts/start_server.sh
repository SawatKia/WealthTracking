# start_server.sh - Server startup and management
#!/bin/bash
source ./utils.sh
source ./docker_management.sh
source ./health_check.sh

check_all_containers_health() {
    log_info "Checking health of all required containers..."
    check_all_containers
    return $?
}

start_server() {
    verify_directory
    
    log_info "Stopping existing containers..."
    docker compose down
    countdown_timer 5
    
    log_info "Starting Production server containers from built image..."
    docker compose -f docker-compose.prod.yml up -d --no-build
    
    log_info "Waiting for server to fully start..."
    countdown_timer 10
    
    local retry_count=0
    local max_retries=3
    
    while ! check_server_health "$1"; do
        log_info "Server is not responding."
        restart_docker_daemon
        log_info "Retrying server start..."
        retry_count=$((retry_count + 1))
        
        if [ $retry_count -ge $max_retries ]; then
            log_error "Exceeded maximum retries. Exiting..."
            exit 1
        fi
        
        docker compose -f docker-compose.prod.yml up -d --no-build
        countdown_timer 10
    done
    
    log_success "Server is healthy!"
}

main() {
    case "$1" in
        "check-health")
            check_server_health "$2"
            ;;
        "check-all")
            check_all_containers_health
            ;;
        *)
            start_server "$1"
            echo -e "\a"
            log_success "++++Server is ready to use!++++"
            setup_cronjob
            ;;
    esac
}

main "$@"