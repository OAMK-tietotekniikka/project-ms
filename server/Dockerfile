# Use multi-stage build for optimization
FROM node:24-alpine AS build

# Install pnpm globally
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
FROM node:24-alpine AS production

# Install pnpm
RUN npm install -g pnpm
ENV HUSKY=0

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Create app directory
WORKDIR /app

# Copy workspace files and ALL package.json files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/

# Install ONLY server production dependencies
RUN pnpm install --filter=server --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/src ./src

# Copy the server's package.json for scripts
COPY --from=build /app/server/package.json ./package.json

# Change ownership to non-root user
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Start the application
CMD ["pnpm", "run", "start:prod"]