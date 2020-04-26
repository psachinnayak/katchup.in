FROM node:14-alpine
WORKDIR /usr/app
EXPOSE 5200
COPY  . .
RUN npm install --production
CMD node app.js