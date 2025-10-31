FROM node:jod-alpine3.21

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 8000

CMD ["npm", "start"]