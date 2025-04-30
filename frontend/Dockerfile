# Use an official Node.js runtime as the base image
FROM node:18-alpine as BUILD_IMAGE

# Set the working directory in the container to /app
WORKDIR /app/frontend

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the app
RUN npm run build

# Use an official lightweight Node.js runtime as the final base image
FROM node:18-alpine as PRODUCTION_IMAGE

# Set the working directory in the container to /app
WORKDIR /app/frontend

# Install serve to serve the app on a static server
RUN npm install -g serve

# Copy the build directory and src directory from the build image
COPY --from=BUILD_IMAGE /app/frontend/ /app/frontend/

# Expose port 5000 for the app
EXPOSE 5000

#install typescript
RUN npm install typescript

# Run the app
#CMD ["npm", "run", "start"]
CMD ["npm", "run", "preview"]
