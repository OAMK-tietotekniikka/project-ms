# Multi-stage build for optimized production image
FROM node:24-alpine AS build

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace files and ALL package.json files (required for pnpm workspace)
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/
COPY .env ./

# Install ONLY frontend dep
RUN pnpm install --filter=frontend --frozen-lockfile

# Copy ONLY frontend source code
COPY frontend/ ./frontend/

# Build the frontend application
WORKDIR /app/frontend
ENV VITE_NODE_ENV=production
RUN pnpm run build

# Production stage
FROM node:24-alpine AS production

# Install serve globally
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=build /app/frontend/dist ./dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]