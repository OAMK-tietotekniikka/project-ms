# Use an official Node.js runtime as the base image
FROM node:24-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory in the container to /app
WORKDIR /app/server

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN apk add --no-cache git
RUN pnpm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the app
RUN pnpm run build

# Expose port 8080 for the app
ENV NODE_ENV=development
ENV SERVER_PORT 8080
EXPOSE $SERVER_PORT

# Run the app
CMD ["pnpm","run", "start:dev"]