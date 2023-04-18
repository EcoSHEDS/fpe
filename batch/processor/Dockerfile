FROM node:14-alpine

WORKDIR /app
COPY . /app

RUN npm install

USER node

CMD ["node", "process.js"]
