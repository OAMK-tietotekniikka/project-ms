# Use an official Node.js runtime as the base image
FROM node:24-alpine AS BUILD_IMAGE

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory in the container to /app
WORKDIR /app/frontend

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN pnpm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the app
RUN pnpm run build

# Use an official lightweight Node.js runtime as the final base image
FROM node:24-alpine AS PRODUCTION_IMAGE

# Set the working directory in the container to /app
WORKDIR /app/frontend

# Install serve to serve the app on a static server
RUN pnpm install -g serve

# Copy the build directory and src directory from the build image
COPY --from=BUILD_IMAGE /app/frontend/ /app/frontend/

# Expose port 5000 for the app
EXPOSE 5000

#install typescript
RUN pnpm install typescript

# Run the app
CMD ["pnpm", "run", "start"]
