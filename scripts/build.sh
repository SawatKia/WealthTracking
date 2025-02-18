# build.sh - Build application and Docker images
#!/bin/bash
source ./utils.sh

build_application() {
    verify_directory
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed."
        exit 1
    fi

    cd backend/V0.2 || exit
    log_info "Installing dependencies..."
    npm ci
    
    log_info "Building the application using Babel..."
    npm run build
    
    cd ../../
}

build_docker_images() {
    log_info "Building Docker images..."
    set -a
    source ./.env
    set +a
    docker compose -f docker-compose.prod.yml build --no-cache
}

main() {
    build_application
    build_docker_images
    log_success "Build process complete!"
}

main