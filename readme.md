# Project Setup and Development Guide

## Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js**: [Install Node.js](https://nodejs.org/)

### Backend Prerequisites

- **Docker Desktop**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **PostMan**: [download Postman](https://www.postman.com/downloads/)

## Getting Started

### 0. Clonning the project

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

#### Creating a New Project

1. Remove the existing "frontend" directory if it exists
2. Create a new frontend directory using your preferred framework (React, Vue, Angular, etc.) or whatever
3. Open your created directory in your workspace and start coding.

#### Modifying an Existing Project

1. Open the project directory in your workspace.
2. Open a terminal and navigate to the frontend directory:

```bash
cd frontend
```

3. Install dependencies:

```bash
npm install
```

4. Start the frontend development server:

```bash
npm run start
```

- if you want to call the api you need to run the backend (this will running both frontend and backend at the same origin) **if you are in early stages of Frontend development, you probably only run your frontend with `npm run start` or whatever. for faster start your runtime.** running the backend can take some time.
- **you should try to run the backend at least once** (since the project isn't too big, it can be easier to run). before dev your frontend.

### 3. Backend Setup

1. Download and install `Docker Desktop`.
2. Create a `.env` file in the root directory (same level as `~/backend`, `~/.vscode`, `~/design`, `~/frontend`, `~/project_structure.txt`) with the following keys and values(or your desired value):

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
FORCE_DB_RESET=false # tldr: recreate all tables.; usually use when there is a new configuration in any part of the db either triggering function or table schema
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
GOOGLE_APPLICATION_CREDENTIALS=/usr/src/WealthTrack/service-account.json

GEMINI_KEY=<your-own-key> # https://aistudio.google.com/app/apikey
GEMINI_CLASSIFICATION_MODEL=gemini-1.5-pro
GEMINI_MAPPING_MODEL=gemini-2.0-flash-exp # for long token usage
GEMINI_COMMON_MODEL=gemini-1.5-flash-8b
```

1. Open Docker Desktop.
2. In the project root directory, build and start the Docker container:

```bash
docker-compose up -d --build
```

6. Check your app with Postman or Browser at _localhost:APP_PORT_.

### 4. Running the Backend

To watch for changes in the backend, you need to stop and restart the Docker container after making modifications:

1. Stop the container:

```bash
docker-compose down
```

2. Build and start the container again:

```bash
docker-compose up -d --build
```

3. Check your app with Postman or Browser at _localhost:PORT_.

---

**Alternatively, you can use VSCode for a one-click run:**

1. Go to the Run and Debug tab `Ctrl+Shift+D`.
2. In the dropdown menu
   - select `Docker: Attach to Node (docker, React rebuild)` and press `F5` to build both frontend and backend (to wach the changed you have made, in both).
   - select `Docker: Attach to Node (with docker-rebuild only)` and press`F5` to build only backend
3. Check your app with Postman or Browser at _localhost:APP_PORT_.

#### watch change in the database with PgAdmin4

1. open the browser with `localhost:5050` as we defined this port in `docker-compose.yml`
2. enter email and password as you set in `.env` file
3. after you signed in, click add server
4. name anything you want.
5. click `connection` tab
6. Enter hostname `postgres`(db service name defined inn docker-compose.ym;) or use ip address of container by this command `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <container_name>`
7. Enter username and password below as you set in `.env`

#### Debugging Backend

there are 2 options to debug your code

1. use the breakpoint - but this option you have to find the way on your own. I have tried but I can't use this option.
2. log the variable and check it in contaniner logs

## Note

- Examine the design directory to understand how the backend works.
- to fully-rebuild, you also need to do the Frontend Setup
- testing is perform outside the Docker, so you need to ues `npm i` to download the dependencies.

### Remember, you don't need to rebuild every time unless:

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

- to list the structure, navigate to your desired directory and use this command `tree /F /A > project_structure.txt`
  - `tree`: Displays the directory structure
  - `/F`: Displays the names of the files in each folder
  - `/A` option tells the tree command to use ASCII characters instead of extended characters. This will produce output using "|" and "+" symbols
  - `> backend_structure.txt`: Redirects the output to a text file named "backend_structure.txt"
- to undo the lastest git local commit use this command `git reset --soft HEAD~1`


# Update Change Fronted to React Native
### Guide to Run the Project
1. Check the Project Folder Path
The project folder is located at this path
  `cd .\frontend\V2.0`

2. Run the Web Version 
Open a terminal in the project folder and run the following command to start the Expo development server:
  `npx expo start`
-After running the command, the terminal will display a QR code and some instructions.
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
