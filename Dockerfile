FROM node:alpine
WORKDIR /usr/KafkaBOT
COPY . .
RUN npm install && npm install tsx -g
RUN npm run build
CMD ["npm", "run", "start:prod"]