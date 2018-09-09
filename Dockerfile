FROM node:10-alpine AS build

# tini allows kernel signals like SIGINT to be handled properly
RUN apk add --no-cache tini

WORKDIR /home/node/app
COPY package*.json ./
RUN npm install

COPY . .

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]

USER node
