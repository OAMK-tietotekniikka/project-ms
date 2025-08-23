FROM node:24-slim AS build

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy workspace files and ALL package.json files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/

# Install ONLY server dep
RUN pnpm install --filter=server --frozen-lockfile

# Copy ONLY server source code
COPY server/ ./server/

# Build the server application
WORKDIR /app/server
RUN pnpm run build

# Production stage
FROM node:24-slim AS production

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy workspace files and package.json files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/

# Install only production dependencies for the server
RUN pnpm install --filter=server --frozen-lockfile --prod --ignore-scripts


# Set working directory to the server folder
WORKDIR /app/server

# Command to run the application
CMD ["node", "dist/index.js"]
