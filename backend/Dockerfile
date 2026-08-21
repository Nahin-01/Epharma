FROM node:20-alpine AS base

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p uploads && chown -R node:node /usr/src/app
USER node

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/server.js"]
