#!/bin/bash

# Hungry Owl Deployment Script
# Usage: ./deploy.sh [dev-start|dev-stop|restart]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Start development environment
dev_start() {
    log_info "Starting Hungry Owl development environment..."
    check_docker

    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        log_warn ".env.local not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            log_warn "Please update .env.local with your actual credentials."
        else
            log_error ".env.example not found. Please create .env.local manually."
            exit 1
        fi
    fi

    # Export environment variables for docker-compose
    export $(grep -v '^#' .env.local | xargs)

    # Start only postgres and redis in Docker
    log_info "Starting PostgreSQL and Redis..."
    docker-compose up -d postgres redis

    # Wait for services to be healthy
    log_info "Waiting for services to be ready..."
    sleep 5

    # Run Prisma migrations
    log_info "Running database migrations..."
    npx prisma migrate dev --name init 2>/dev/null || npx prisma db push

    # Seed the database if needed
    log_info "Seeding database..."
    npx prisma db seed 2>/dev/null || log_warn "Seeding skipped or already done."

    # Start Next.js development server
    log_info "Starting Next.js development server..."
    npm run dev &

    log_info "🦉 Hungry Owl is running!"
    log_info "   App: http://localhost:3000"
    log_info "   PostgreSQL: localhost:5432"
    log_info "   Redis: localhost:6379"
}

# Stop development environment
dev_stop() {
    log_info "Stopping Hungry Owl development environment..."

    # Stop Next.js
    pkill -f "next dev" 2>/dev/null || true

    # Stop Docker services
    docker-compose down

    log_info "Development environment stopped."
}

# Restart development environment
restart() {
    log_info "Restarting Hungry Owl..."
    dev_stop
    sleep 2
    dev_start
}

# Show usage
usage() {
    echo "Hungry Owl Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  dev-start   Start the development environment"
    echo "  dev-stop    Stop the development environment"
    echo "  restart     Restart the development environment"
    echo ""
}

# Main
case "${1:-}" in
    dev-start)
        dev_start
        ;;
    dev-stop)
        dev_stop
        ;;
    restart)
        restart
        ;;
    *)
        usage
        exit 1
        ;;
esac

