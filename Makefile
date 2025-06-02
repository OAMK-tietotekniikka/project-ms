# Makefile for Project Management Application
# Easily switch between local development and Docker environments

.PHONY: help dev-docker dev-local prod-docker clean status logs

# Default target
help:
	@echo "🚀 Project Management App - Development Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make dev-docker    - Start development environment with Docker (hot reload)"
	@echo "  make dev-local     - Instructions for local development setup"
	@echo "  make prod-docker   - Start production environment with Docker"
	@echo "  make clean         - Stop and remove all containers and volumes"
	@echo "  make status        - Show status of all containers"
	@echo "  make logs          - Show logs for all services"
	@echo "  make logs-server   - Show server logs only"
	@echo "  make logs-frontend - Show frontend logs only"
	@echo "  make logs-db       - Show database logs only"
	@echo "  make restart       - Restart development environment"
	@echo "  make build         - Rebuild development images"

# Dev Docker (hot reload)
dev-docker:
	@echo "🐳 Starting development environment with Docker..."
	@echo "📝 Hot reload for both server and frontend"
	docker-compose -f docker-compose.dev.yml up --build

# Dev Docker in background
dev-docker-bg:
	@echo "🐳 Starting development environment in background..."
	docker-compose -f docker-compose.dev.yml up -d --build
	@echo "✅ Development environment started!"
	@echo "📱 Frontend: http://localhost:5000"
	@echo "🔧 Server API: http://localhost:8081"
	@echo "🗄️  Database: localhost:3307"

# Local development instructions
dev-local:
	@clear
	@echo "Local Development Setup Instructions:"
	@echo ""
	@echo "1. Start MySQL Database:"
	@echo "   chmod +x start-db-local.sh (root folder)"
	@echo "   ./start-db-local.sh (root folder)"
	@echo ""
	@echo "2. Start Server (in server directory):"
	@echo "   cd server && npm install && npm run start:dev"
	@echo ""
	@echo "3. Start Frontend (in frontend directory):"
	@echo "   cd frontend && npm install && npm run dev"
	@echo ""
	@echo "🌐 URLs:"
	@echo "   Frontend: http://localhost:5000"
	@echo "   Server: http://localhost:8081"
	@echo "   Database: localhost:3307"

# Production environment
prod-docker:
	@echo "🏭 Starting production environment..."
	docker-compose -f docker-compose.yml up --build

# Clean up everything
clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker-compose -f docker-compose.yml down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete!"

# Show container status
status:
	@echo "📊 Container Status:"
	@docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show logs for all services
logs:
	docker-compose -f docker-compose.dev.yml logs -f

# Show server logs only
logs-server:
	docker-compose -f docker-compose.dev.yml logs -f pm_server_dev

# Show frontend logs only
logs-frontend:
	docker-compose -f docker-compose.dev.yml logs -f pm_frontend_dev

# Show database logs only
logs-db:
	docker-compose -f docker-compose.dev.yml logs -f mysqldb

# Restart development environment
restart:
	@echo "🔄 Restarting development environment..."
	docker-compose -f docker-compose.dev.yml restart

# Rebuild development images
build:
	@echo "🔨 Rebuilding development images..."
	docker-compose -f docker-compose.dev.yml build --no-cache

# Start only database (useful for local development)
db-only:
	@echo "🗄️  Starting database only..."
	docker-compose -f docker-compose.dev.yml up mysqldb

# Database utilities
db-connect:
	@echo "🔌 Connecting to database..."
	docker exec -it mysqlcontainer_dev mysql -u admin -ppwd@123 studentsdb

# Show database status
db-status:
	docker exec mysqlcontainer_dev mysqladmin -u admin -ppwd@123 status