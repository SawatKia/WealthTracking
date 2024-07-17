FROM node:18-alpine
WORKDIR /usr/src/Wealthtrack-app
COPY package*.json ./
COPY .env ./
RUN npm install
COPY .src ./src
EXPOSE 3000
CMD ["node", "src/index.js"]
# CMD ["npm", "debug"]