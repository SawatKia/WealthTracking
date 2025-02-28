#!/bin/bash

sleepWithTimer() {
    for i in $(seq $1 -1 1); do
        printf "\r\033[34mCountdown: %2d\033[0m   " "$i"
        sleep 1
    done
    echo -e "\n"
}

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
sleepWithTimer 3

if [ ! -f "./installing.sh" ] || [ ! -f "./start_server.sh" ]; then
  echo -e "\033[5;31mFiles installing.sh and start_server.sh do not exist. Exiting...\033[0m"
  exit 1
fi

echo -e "\033[7;34m>>>\033[0m installing dependencies..."
./installing.sh
if [ $? -ne 0 ]; then
  echo -e "\033[5;31mFailed to install dependencies. Exiting...\033[0m"
  exit 1
fi

echo -e "\033[1;32m++++ Installed dependencies process complete! ++++\033[0m"

echo -e "\033[7;34m>>>\033[0m Starting server containers process..."

./start_server.sh $1 $2
