#!/bin/bash
if [ "${PWD##*/}" != "WealthTracking" ]; then
    echo ">>> Please run this script from the WealthTracking directory."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo ">>> npm is not installed."
    exit 1
fi

cd backend/V0.2 || exit
echo ">>> Installing dependencies..."
npm ci

echo ">>> Building the application using Babel..."
npm run build

# Change back to the WealthTracking root directory
cd ../../

echo ">>> Building Docker images..."
docker compose -f docker-compose.prod.yml build
