#!/bin/bash

echo -e "\033[1;34m>>>\033[0m verifying the current directory..."
if [ "${PWD##*/}" != "WealthTracking" ]; then
  echo -e "Please run this script from the WealthTracking directory."
  exit 1
fi
echo -e "\033[1;34m>>>\033[0m Pulling git repo..."
git pull origin main --recurse-submodules
if [ $? -ne 0 ]; then
  echo -e "\033[1;31mFailed to pull git repo. Exiting...\033[0m"
  exit 1
fi

echo -e "\033[1;34m>>>\033[0m Building source code and Docker image process..."
./build.sh
if [ $? -ne 0 ]; then
  echo -e "Failed to build source code. Exiting..."
  exit 1
fi

echo -e "\033[1;32m++++ Build process complete! ++++\033[0m"

echo -e "\033[1;34m>>>\033[0m Starting server containers process..."

./start_server.sh $1 $2
