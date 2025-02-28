#!/bin/bash

echo -e "\033[7;34m>>>\033[0m verifying the current directory..."
if [ "${PWD##*/}" != "WealthTracking" ]; then
  echo -e "\033[1;31mPlease run this script from the WealthTracking directory.\033[0m"
  exit 1
fi

echo -e "\033[7;34m>>>\033[0m Pulling git repo..."
git restore .
echo -e "\033[1;32m++++ Git repo restored! ++++\033[0m"
git pull origin main --recurse-submodules
if [ $? -ne 0 ]; then
  echo -e "\033[1;31mFailed to pull git repo. Exiting...\033[0m"
  exit 1
fi

if [ ! -f "./installing.sh" ] || [ ! -f "./start_server.sh" ]; then
  echo -e "\033[5;31mFiles installing.sh and start_server.sh do not exist. Exiting...\033[0m"
  exit 1
fi

echo -e "\033[7;34m>>>\033[0m Building source code and Docker image process..."
./installing.sh
if [ $? -ne 0 ]; then
  echo -e "\033[5;31mFailed to build source code. Exiting...\033[0m"
  exit 1
fi

echo -e "\033[1;32m++++ Build process complete! ++++\033[0m"

echo -e "\033[7;34m>>>\033[0m Starting server containers process..."

./start_server.sh $1 $2
