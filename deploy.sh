#!/bin/bash

echo ">>> verifying the current directory..."
if [ "${PWD##*/}" != "WealthTracking" ]; then
  echo "Please run this script from the WealthTracking directory."
  exit 1
fi
echo ">>> Pulling git repo..."
git pull origin main --recurse-submodules
if [ $? -ne 0 ]; then
  echo "Failed to pull git repo. Exiting..."
  exit 1
fi

echo ">>> Building source code and Docker image process..."
./build.sh
if [ $? -ne 0 ]; then
  echo "Failed to build source code. Exiting..."
  exit 1
fi

echo "++++ Build process complete! ++++"

echo ">>> Starting server containers process..."
APP_IP="${APP_IP:-127.0.0.1}"    # Default to localhost if not provided
APP_PORT="${APP_PORT:-3000}"     # Default to 3000 if not provided

export APP_IP APP_PORT           # Make them available to start_server.sh
./start_server.sh
