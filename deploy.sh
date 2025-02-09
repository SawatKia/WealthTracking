#!/bin/bash

echo "Pulling git repo..."
git pull origin main --recurse-submodules
if [ $? -ne 0 ]; then
  echo "Failed to pull git repo. Exiting..."
  exit 1
fi

echo "Building source code and Docker image..."
./build.sh
if [ $? -ne 0 ]; then
  echo "Failed to build source code. Exiting..."
  exit 1
fi

echo "Starting server containers..."
./start_server.sh
