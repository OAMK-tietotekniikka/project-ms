# Use multi-stage build for optimization
FROM node:24-alpine AS build

# Install pnpm globally
RUN npm install -g pnpm

# Create app directory with correct permissions
WORKDIR /app

# Copy package files first for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package*.json ./


# Install dependencies with frozen lockfile for reproducible builds
RUN pnpm install --filter ./... --frozen-lockfile --prod=false

# Copy source code
COPY server/ .

# Build the application
RUN pnpm run build

# Production stage
FROM node:24-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Create app directory
WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package*.json ./

# Install only production dependencies
RUN pnpm install --filter ./... --frozen-lockfile --prod=true

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src

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