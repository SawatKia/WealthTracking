# Project Setup and Development Guide
*this readme rewrite by AI from `old_readme.md` if you have any question, please see old_readme.md first*
## Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js**: [Install Node.js](https://nodejs.org/)
### Backend Prerequisites
- **Docker Desktop**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **MongoDB Compass**: [Download MongoDB Compass](https://www.mongodb.com/products/compass)
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
1. Download and install `MongoDB Compass` to examine the data stored in the database.
2. Download and install `Docker Desktop`.
3. Create a `.env` file in the root directory (same level as `~/backend`, `~/.vscode`, `~/design`, `~/frontend`, `~/project_structure.txt`) with the following keys and values:
```makefile
NODE_ENV=development
# or NODE_ENV=production
MONGO_INITDB_ROOT_USERNAME=any_name
MONGO_INITDB_ROOT_PASSWORD=any_password
MONGO_HOST=mongodb # the same name of DB service in docker-compose
PORT=3000 # or your desired port
```
4. Open Docker Desktop.
5. In the project root directory, build and start the Docker container:
```bash
docker-compose up -d --build
```
6. Check your app with Postman or Browser at *localhost:PORT*.
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
3. Check your app with Postman or Browser at *localhost:PORT*.
---
**Alternatively, you can use VSCode for a one-click run:**
1. Go to the Run and Debug tab `Ctrl+Shift+D`.
2. Select the dropdown menu `Docker: Attach to Node (with fully-rebuild)` and press `F5`.
3. Check your app with Postman or Browser at *localhost:PORT*.
## Note
- Examine the design directory to understand how the backend works.
- to run only backend part select `Docker: Attach to Node (with docker-rebuild)`. Check your app with Postman at *localhost:PORT*.
- to fully-rebuild, you also need to do the Frontend Setup
### Remember, you don't need to rebuild every time unless:
 - You've made changes to your Dockerfile
 - You've added or updated dependencies in your package.json
 - You've made changes to your source code that aren't reflected in the container due to volume mounts
## Common Issues and Troubleshooting
- **Issue 1**: If the backend is not connecting to MongoDB, ensure your `.env` file has the correct values and Docker Desktop is running.
- **Issue 2**: If the frontend is not starting, make sure all dependencies are installed with `npm install`.







