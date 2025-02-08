#!/bin/bash

echo "pulling git repo..."
git pull origin main --recurse-submodules
if [ $? -ne 0 ]; then
  echo "Failed to pull git repo. Exiting..."
  exit 1
fi

echo "build source code and build image..."
./build.sh
if [ $? -ne 0 ]; then
  echo "Failed to build source code. Exiting..."
  exit 1
fi

echo "start server containers..."
./start_server.sh