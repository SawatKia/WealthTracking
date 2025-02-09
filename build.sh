#!/bin/bash
if [ "${PWD##*/}" != "WealthTracking" ]; then
    echo "Please run this script from the WealthTracking directory."
    exit 1
fi
if [ !$(npm -v) ]; then
    echo "npm is not installed."
    exit 1
fi

cd backend/V0.2 || exit
echo "Installing dependencies..."
npm ci

# Build the application using Babel
echo "Building the application..."
npm run build

# Change back to root directory to run docker-compose.prod
cd ../../

# Build Docker images
docker compose -f docker-compose.prod.yml build
