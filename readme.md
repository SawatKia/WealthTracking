# Project Setup and Development Guide

## TLDR
- Project setup: Clone repo, install Node.js, Docker Desktop, and Postman
- Frontend: Create/reactivate frontend directory and install dependencies
- Backend: Configure .env, build Docker containers, and start services
- Deployment: Pull code, run deploy.sh, ensure proper .env configuration
- Troubleshooting: Docker, PostgreSQL, and frontend issues

## Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js**: [Install Node.js](https://nodejs.org/)

### Backend Prerequisites

- **Docker Desktop**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Getting Started

### 0. Cloning the project

To clone the project from GitHub, follow these steps:

1. Open your terminal or command prompt.
2. Navigate to the directory where you want to clone the project.
3. Run the following command to clone the repository:

```bash
git clone https://github.com/SawatKia/4thYear-Project.git
```

4. Once the cloning process is complete, navigate into the cloned directory:

```bash
cd WealthTracking
```

Now you have successfully cloned the project from GitHub.

### 1. Create a New Branch

- Before you start coding, make sure you are in your own branch. If your branch is not available, create a new one:

```bash
git checkout -b your-branch-name
```

### 2. Frontend Setup

#### Guide to Run the Project
1. Check the Project Folder Path
The project folder is located at this path
  `cd .\frontend\V2.0`

2. Run the Web Version
   - Open a terminal in the project folder and run the following command to start the Expo development server: `npx expo start`
   - After running the command, the terminal will display a QR code and some instructions.
   - To view the web version, press w on your keyboard. This will open the project in a browser.

   - You can also refer to this guide for creating your first app with Expo:
   [Expo - Create Your First App](https://docs.expo.dev/tutorial/create-your-first-app/)

3. Run the App on Your Phone (Optional)
   - Download the Expo Go app on your phone from App Store or Google Play:

   - Sign in to Expo Go:
     Open the Expo Go app and sign in with your Expo account (if you don’t have one, create it).

   - Scan the QR Code:
   After you run npx expo start in the terminal, you will see a QR code.
   Open the camera on your phone and scan the QR code that appears in the terminal.
   - Once scanned, Expo Go will automatically open and load the app you’re developing.

### 3. Backend Setup

#### Method 1: Quick Start Backend using Pre-Built Image from Docker Hub

1. Download the `docker-compose.prof.yml` file into your desired folder:

```bash
wget https://raw.githubusercontent.com/SawatKia/WealthTracking/refs/heads/main/docker-compose.prof.yml
```

2. Run the following command to pull the latest Docker image from Docker Hub and start the container:

```bash
docker compose -f docker-compose.prof.yml up -d
```

This method uses pre-built images from Docker Hub and is the fastest way to get the backend running. After completion, you can access the API documentation at `localhost:3000/api/v0.2/docs`.

Note: Make sure you have Docker Desktop running before executing these commands.

---

#### Method 2: Build from Source Code Manually

1. Download and install `Docker Desktop`.
2. Create a `.env` file in the root directory (same level as `~/backend`, `~/.vscode`, `~/design`, `~/frontend`, `~/project_structure.txt`) with the following keys and values (or your desired values):

```makefile
NODE_ENV=development
# NODE_ENV=production
# NODE_ENV=test
APP_PORT=3000
APP_DOMAIN=WealthTrack
ACCESS_TOKEN_SECRET=<your-secure-access-token-secret>
REFRESH_TOKEN_SECRET=<your-secure-refresh-token-secret>
SALT_ROUNDS=10

POSTGRES_USER=<username> # your desired username for connecting to the db
POSTGRES_PASSWORD=<password> # your desired password for connecting to the db
POSTGRES_HOST=postgres # docker service name
POSTGRES_PORT=5432
POSTGRES_DB=WealthTrack_DB
# POSTGRES_DB=your_database_name
POSTGRES_TEST_NAME=test_database_name
DB_RESET=false # tldr: recreate all tables.; usually use when there is a new configuration in any part of the db either triggering function or table schema
RELOAD_MOCK_DATA=false

PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=root

REDIS_HOST=redis
REDIS_PORT=6379

EASYSLIP_URL=https://developer.easyslip.com
EASYSLIP_KEY=<your-easyslip-api-key> # https://developer.easyslip.com/

GOOGLE_CLIENT_ID=<your-google-client-id> # examine in GCP, https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_SECRET=<your-google-client-secret> # examine in GCP, https://console.cloud.google.com/apis/credentials
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

PROJECT_NAME=<project-name> # examine in GCP, https://console.cloud.google.com/iam-admin/settings
PROJECT_ID=<project-id> # examine in GCP, https://console.cloud.google.com/iam-admin/settings
PROJECT_NUMBER=<project-number> # examine in GCP, https://console.cloud.google.com/iam-admin/settings

DOCUMENT_AI_LOCATION=us
DOCUMENT_AI_PROCESSOR_ID=<processor-id> # examine in GCP, https://console.cloud.google.com/ai/document-ai/locations/us/processors
GOOGLE_APPLICATION_CREDENTIALS=/usr/src/WealthTrack/.src/configs/service-account.json # download json key file from nodeJsDocumentAi service-account, https://console.cloud.google.com/apis/credentialshttps://console.cloud.google.com/apis/credentials

GEMINI_KEY=<your-own-key> # https://aistudio.google.com/app/apikey
GEMINI_CLASSIFICATION_MODEL=gemini-1.5-pro
GEMINI_MAPPING_MODEL=gemini-2.0-flash-exp # for long token usage
GEMINI_COMMON_MODEL=gemini-1.5-flash-8b

GOOGLE_SHEET_ID=<logMonitoringSheetId> # only in production
```

3. Open Docker Desktop.
4. In the project root directory, build and start the Docker container:

```bash
docker-compose up -d --build
```

5. Check your app with Postman or Browser at `localhost:APP_PORT` or `localhost:3000/api/v0.2/docs`.


### 4. Running the Backend

To watch for changes in the backend (if using Method 1), you need to stop and restart the Docker container after making modifications:

1. Stop the container:

```bash
docker-compose down
```

2. Build and start the container again:

```bash
docker-compose up -d --build
```

3. Check your app with Postman or Browser at `localhost:PORT`.

If using Method 2, simply restart the container with:

```bash
docker compose -f docker-compose.prof.yml restart
```

### 5. view data in database
  - Exec Postgres: `docker exec -it postgres_container psql -U WealthTrackApi -d WealthTrack_DB`
  - Common Commands:
      - `\l` - list databases
      - `\c WealthTrack_DB` - switch database
      - `\dt` - list tables
      - `\d users` - describe table
      - `SELECT * FROM users LIMIT 10;` -  Show first 10 users
      -`\q` - exit psql## common commands
      - `\l` - list databases
      - `\c WealthTrack_DB` - switch database
      - `\dt` - list tables
      - `\d users` - describe table
      - `SELECT * FROM users LIMIT 10;` -  Show first 10 users
      - `\q` - exit psql
  - Exit
      - Pressing `q` → This exits help mode and returns you to the normal prompt.
  - Cancel Current Command
       - Pressing `Ctrl + C` → This forcefully cancels the current command and resets the input buffer.
### Deployment

#### Server Deployment Guide

1. **Prerequisites**
   - Docker installed and running
   - Docker compose installed
   - Node.js (optional, for local development)
   - Git for pulling the latest changes

2. **Deployment Steps**

```bash
# 1. Pull the latest code from repository
git pull origin main --recurse-submodules

# 2. Run the deployment script
./deploy.sh
```

The `deploy.sh` script will:
- Pull the latest code
- install the dependencies
- Start the server containers

3. **Environment Variables**
   Ensure you have a proper `.env` file configured with production values:
   ```bash
   NODE_ENV=production
   APP_PORT=your_port
   APP_DOMAIN=your_domain
   ```
   Refer to the `.env` template in the project root for all required variables.

4. **Health Check**
   The server includes automatic health checks that will:
   - Verify database connectivity
   - Check API endpoint responsiveness
   - Restart containers if health checks fail

5. **Error Handling**
   - Container restart: If a container fails, it will automatically restart
   - Docker daemon monitoring: The system will attempt to restart Docker if it becomes unresponsive
   - Cron job: Automatic health monitoring (Linux only)

6. **Security Considerations**
   - Ensure proper permissions for Docker socket
   - Keep environment files secure
   - Regularly update dependencies
   - Monitor container logs

7. **Troubleshooting**

Common Issues:
- **Docker Daemon Not Running**:
  ```bash
  sudo systemctl restart docker
  ```
- **Health Check Failing**:
  ```bash
  ./start_server.sh
  ```
- **Container Crashing**:
  ```bash
  docker logs <container_name> --tail=100
  ```

8. **Cron Job (Linux only)**

The deployment includes an automatic health check cron job that will:
- Check server status every 5 minutes
- Restart the server if it becomes unresponsive

## Note

- Examine the design directory to understand how the backend works.
- to fully-rebuild, you also need to do the Frontend Setup
- testing is perform outside the Docker, so you need to use `npm i` to download the dependencies.
- Remember, you don't need to rebuild every time unless:
  - You've made changes to your Dockerfile
  - You've added or updated dependencies in your package.json
  - You've made changes to your source code that aren't reflected in the container due to volume mounts

## Common Issues and Troubleshooting

- **Issue 1**: If the backend is not connecting to PostgreSQL, ensure your `.env` file has the correct values and Docker Desktop is running.
- **Issue 2**: If the frontend is not starting, make sure all dependencies are installed with `npm install`.
- **Issue 3**: you might want to remove the docker volume for some reason (eg. modifying the `.env` file, need to remove the volume to make a change to affect). which can be done by this step:
  - Stop your Docker containers: `docker-compose down`
  - Remove the volume: `docker volume rm <your_project_name_postgres_data>`
     If you're unsure about the exact volume name, you can list all volumes with `docker volume ls` and look for the one related to your data.

## Miscellaneous

- to list the structure, navigate to your desired directory and use this command `tree /F /A > project_structure.txt` (Only Windows)
  - `tree`: Displays the directory structure
  - `/F`: Displays the names of the files in each folder
  - `/A` option tells the tree command to use ASCII characters instead of extended characters. This will produce output using "|" and "+" symbols
  - `> backend_structure.txt`: Redirects the output to a text file named "backend_structure.txt"
- to undo the lastest git local commit use this command `git reset --soft HEAD~1`