# Use the official Node.js LTS image
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the application's port
EXPOSE 3000

# Run the app
CMD ["node", "index.js"]
