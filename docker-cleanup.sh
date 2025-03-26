#!/bin/bash

# Prune all stopped containers
docker container prune -f

# Prune all unused images
docker image prune -a -f

# Prune all unused volumes
docker volume prune -f

# Prune the build cache
docker builder prune -f

# Show current disk usage
echo "Current Docker disk usage:"
docker system df