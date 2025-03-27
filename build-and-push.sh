#  The script is simple and straightforward. It takes a single argument, which is the tag name. The script then builds the Docker image, tags it with the tag name and latest, and pushes it to Docker Hub. 

#  To run the script, execute the following command: 
#  $ ./build-and-push.sh 1.0.2
#  The script will build the Docker image, tag it with 1.0.2 and latest, and push it to Docker Hub. 
 
#!/bin/bash

if [ -z "$1" ]; then
    echo "Error: Tag name is required"
    exit 1
fi
echo "Usage: $1 as a <tag_name>"

TAG_NAME=$1

# Change directory
cd backend/V0.2/

# Build Docker image
docker build --no-cache -t swtl918/wealthtracking:$TAG_NAME .

# tagging
docker tag swtl918/wealthtracking:$TAG_NAME swtl918/wealthtracking:latest

# Push to Docker Hub
docker push swtl918/wealthtracking:$TAG_NAME 
docker push swtl918/wealthtracking:latest

echo "Successfully built and pushed \033[1;32mswtl918/wealthtracking:$TAG_NAME\033[0m and \033[1;32mswtl918/wealthtracking:latest\033[0m to Docker Hub"
 
