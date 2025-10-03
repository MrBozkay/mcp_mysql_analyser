# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the application's source code from your host to your image filesystem.
COPY . .

# Build the TypeScript code
RUN npm run build

# Your app binds to container port 3000, but the server communicates over stdio, so no need to expose a port.

# Define the command to run your app
CMD [ "npm", "start" ]
