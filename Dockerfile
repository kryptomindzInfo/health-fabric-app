
FROM node:8
WORKDIR /usr/src/app/
COPY . .
COPY ./app/package*.json ./app/
WORKDIR /usr/src/app/app
RUN npm install
EXPOSE 6001 6002
CMD ["node", "server.js"]