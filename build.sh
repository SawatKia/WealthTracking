#!/bin/bash
if [ "${PWD##*/}" != "WealthTracking" ]; then
    echo "\033[1;31m>>> Please run this script from the WealthTracking directory.\033[0m"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "\033[1;34m>>>\033[0m npm is not installed."
    exit 1
fi

cd backend/V0.2 || exit
echo "\033[1;34m>>>\033[0m Installing dependencies..."
npm ci

echo "\033[1;34m>>>\033[0m Building the application using Babel..."
npm run build

# Change back to the WealthTracking root directory
cd ../../

echo "\033[1;34m>>>\033[0m Building Docker images..."
set -a
source ./.env
set +a
docker compose -f docker-compose.prod.yml build --no-cache
