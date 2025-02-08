#!/bin/bash
if [ "${PWD##*/}" != "WealthTracking" ]; then
    echo "Please run this script from the WealthTracking directory."
    exit 1
fi

cd backend/V0.2 || exit
npm install

# Build the application using Babel
npm run build

# Change back to root directory
cd ../../

# Build Docker images
docker-compose -f docker-compose.prod.yml build