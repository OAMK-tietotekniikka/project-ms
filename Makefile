# Easily switch between local development and Docker environments

.PHONY: help dev-docker dev-local prod-docker clean status logs

# Default target
help:
	@echo "Project Management System - Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make dev-docker    - Start development environment with Docker (hot reload)"
	@echo "  make dev-local     - Instructions for local development setup"
	@echo "  make prod-docker   - Start production environment with Docker"
	@echo "  make clean         - Stop and remove all containers and volumes"
	@echo "  make status        - Show status of all containers"
	@echo "  make restart       - Restart development environment"
	@echo "  make build         - Rebuild development images"

# Dev Docker (hot reload)
dev-docker:
	@echo "🐳 Starting development environment with Docker..."
	@echo "📝 Hot reload for both server and frontend"
	docker-compose -f docker-compose.dev.yml up --build


# Local development instructions
dev-local:
	@clear
	@echo "Local Development Setup Instructions:"
	@echo ""
	@echo "1. Install dependencies:"
	@echo "pnpm install"
	@echo ""
	@echo "2. Start Database:"
	@echo "   cd scripts"
	@echo "   chmod +x scripts/start_mdb.sh (root folder)"
	@echo "   ./start_mdb.sh (root folder)"
	@echo ""
	@echo "3. Start Server (in server directory):"
	@echo "   cd server && pnpm run start:dev"
	@echo ""
	@echo "4. Start Frontend (in frontend directory):"
	@echo "   cd frontend && pnpm run dev"
	@echo ""
	@echo "🌐 URLs:"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Server: http://localhost:8000"
	@echo "   Database: localhost:3306"

# Production environment
prod-docker:
	@echo "Starting production environment..."
	docker-compose -f docker-compose.yml up --build

# Clean up everything
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker-compose -f docker-compose.yml down -v --remove-orphans
	docker system prune -f
	@echo "Cleanup complete!"

# Show container status
status:
	@echo "Container Status:"
	@docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Restart development environment
restart:
	@echo "🔄 Restarting development environment..."
	docker-compose -f docker-compose.dev.yml restart

# Rebuild development images
build:
	@echo "🔨 Rebuilding development images..."
	docker-compose -f docker-compose.dev.yml build --no-cache
