FROM node:8

RUN npm update && npm install -g nodemon create-react-app

ENV NODE_ENV=production
ENV HOME=/home/node

USER node
WORKDIR $HOME/app
