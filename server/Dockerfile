
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./

CMD ["npm", "install"]

COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]