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

./start_server.sh $1 $2
