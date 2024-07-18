# Implementing
- before start coding **make sure you are in your own branch** (if your branch is not available, create a new one by your own)
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
## backend
- download `mongoDBCompass` to examine what datas store in the database
- download `Docker Desktop`
- create a `.env` file in root level (the samee level as `backend` `.vscode` `design` `frontend` `project_structure.txt`) with these following keys and value
```
NODE_ENV=development 
# or NODE_ENV=production
MONGO_INITDB_ROOT_USERNAME=any_name
MONGO_INITDB_ROOT_PASSWORD=any_password
MONGO_HOST=mongodb # the same name of DB service in docker-compose
PORT=3000 # or your desired port
```
- open `Docker Desktop`
- at ~/backend
- use `docker-compose up -d --build` to build and start docker comatainer
- check your app at `localhost:PORT`

**when modified any code to watch the changes, you need to stop the container by command or by Docker Desktop as you desired. and start the container again by above command**

- for one click to run. goto run and debug tab select the dropdown in the menu `Docker: Attach to Node (with rebuild)` 
### Remember, you don't need to rebuild every time unless:
 - You've made changes to your Dockerfile
 - You've added or updated dependencies in your package.json
 - You've made changes to your source code that aren't reflected in the container due to volume mounts
# Note
_examine the design directory to understand how the backend works_