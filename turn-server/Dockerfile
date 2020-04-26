FROM node:14-alpine
WORKDIR /usr/app

EXPOSE 3478
COPY . .
RUN npm install --production
CMD node turn-server.js