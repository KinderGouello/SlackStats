FROM node:8

RUN useradd --user-group --create-home --shell /bin/false nodejs
RUN npm update && npm install -g nodemon create-react-app

ENV NODE_ENV=production
ENV HOME=/home/nodejs

USER nodejs
WORKDIR $HOME/app
