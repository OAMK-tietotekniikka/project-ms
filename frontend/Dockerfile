# Multi-stage build for optimized production image
FROM node:24-alpine AS build

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package*.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy server source code
COPY frontend/ .

# Build the application
RUN pnpm run build

FROM node:24-alpine AS production

# Install serve globally
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]