#!/bin/bash

if [ -z "$1" ]; then
    echo "Error: Tag name is required"
    exit 1
fi
echo "Usage: $1 as a <tag_name>"

TAG_NAME=$1

# Change directory
cd backend/V0.2/

# Build Docker image
docker build -t swtl918/wealthtracking:$TAG_NAME .

# tagging
docker tag swtl918/wealthtracking:$TAG_NAME swtl918/wealthtracking:lastest

# Push to Docker Hub
docker push swtl918/wealthtracking:$TAG_NAME 
docker push swtl918/wealthtracking:lastest

echo "Successfully built and pushed swtl918/wealthtracking:$TAG_NAME"
