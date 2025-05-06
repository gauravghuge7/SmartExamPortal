
FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install
CMD ["npm", "install"]

COPY . .
EXPOSE 5000
CMD ["npm", "run", "start"]