# deploy.sh - Main deployment script
#!/bin/bash
source ./utils.sh

show_help() {
    cat << EOF
WealthTracking Deployment Scripts
================================

Usage: ./deploy.sh [OPTIONS] [IP]

Options:
    -h, --help     Show this help message
    
Parameters:
    IP             (Optional) Server IP address where the application will be deployed
                   - If not provided, deploys to localhost:3000
                   - If set to 'localhost', uses port 3000
                   - If set to an IPv4 address, uses nginx proxy (port 80)

Examples:
    ./deploy.sh                    # Deploy to localhost:3000
    ./deploy.sh 192.168.1.100     # Deploy to production server at 192.168.1.100
    ./deploy.sh -h                 # Show this help message

Additional Scripts:
    build.sh         - Builds the application and Docker images
    start_server.sh  - Manages server startup and health checks
    health_check.sh  - Monitors server health status

Note:
    - Run all scripts from the WealthTracking directory
    - Ensure Docker and npm are installed
    - For production deployments, verify nginx configuration
EOF
}

main() {
    # Handle help command
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    verify_directory
    
    log_info "Pulling git repo..."
    if ! git pull origin main --recurse-submodules; then
        log_error "Failed to pull git repo. Exiting..."
        exit 1
    fi
    
    log_info "Building source code and Docker image process..."
    if ! ./build.sh; then
        log_error "Failed to build source code. Exiting..."
        exit 1
    fi
    
    log_success "++++ Build process complete! ++++"
    
    log_info "Starting server containers process..."
    ./start_server.sh "$1"
}

main "$@"