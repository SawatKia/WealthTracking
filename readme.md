# Implementing
- before start coding **make sure you are in your own branch** (if your branch is not available, create a new one by your own)
- if you want to call the api you need to run the backend (for running both frontend and backebd at the same origin) **if you are in early stages of Frontend development, you probably only run your frontend with `npm run start` or whatever. for faster start your runtime.** running the backend can take some time.
- **you should try to run the backend at least once** (since the project isn't too big, it can be easier to run). before dev your frontend.
## frontend
### create new
- for newly create Project, remove the "frontend" directory(if the directory is exist) 
- create your own frontend directory by React, Vue, Angular, etc. anything you 
want.
- open your created directory to workspace 
- start coding
### modifying existing
- open Project directory to workspace
- open terminal goto frontend directory by ```cd frontend```  and use ```npm i``` to install dependencies
- start coding
- run `npm run start` in frontend to see changes
## backend
- download `mongoDBCompass` to examine what datas store in the database
- download `Docker Desktop`
- create a `.env` file in root level (the same level as `backend` `.vscode` `design` `frontend` `project_structure.txt`) with these following keys and value
```
NODE_ENV=development 
# or NODE_ENV=production
MONGO_INITDB_ROOT_USERNAME=any_name
MONGO_INITDB_ROOT_PASSWORD=any_password
MONGO_HOST=mongodb # the same name of DB service in docker-compose
PORT=3000 # or your desired port
```
- open `Docker Desktop`
- at ~ *(project root level)* or press f5, find dropdown in VsCode and select `Docker: Attach to Node (with rebuild)` and **the rest steps can be omit**
- use `docker-compose up -d --build` to build and start docker container
- check your app at `localhost:PORT`

**when modified any code** to watch the changes, **you need to stop the container** by command or by Docker Desktop as you desired. **and start the container again** by above command

- for one click run. goto run and debug tab`(ctrl+shift+d)` select the dropdown menu `Docker: Attach to Node (with rebuild)` 
### Remember, you don't need to rebuild every time unless:
 - You've made changes to your Dockerfile
 - You've added or updated dependencies in your package.json
 - You've made changes to your source code that aren't reflected in the container due to volume mounts
# Note
*examine the design directory to understand how the backend works*