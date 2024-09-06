FROM node:18-alpine
WORKDIR /usr/src/Wealthtrack-app
COPY package*.json ./
RUN npm install
COPY .src ./.src
EXPOSE 3000
# CMD ["node", "src/index.js"]
EXPOSE 9229
# CMD ["node", "--inspect=0.0.0.0:9229", "src/index.js"]
CMD ["npm", "run", "debug"]