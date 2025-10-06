#!/bin/bash

# PolyDraw Docker Deployment Script
# This script automates the build and deployment of PolyDraw using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="polydraw"
PORT=${PORT:-3000}
IMAGE_NAME="polydraw:latest"

echo -e "${BLUE}🐳 PolyDraw Docker Deployment Script${NC}"
echo "=================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose not found. Will use docker commands instead."
    USE_COMPOSE=false
else
    USE_COMPOSE=true
fi

# Stop existing container if running
print_status "Stopping existing containers..."
docker stop $APP_NAME 2>/dev/null || true
docker rm $APP_NAME 2>/dev/null || true

# Build the Docker image
print_status "Building Docker image..."
docker build -t $IMAGE_NAME .

# Deploy using Docker Compose or Docker directly
if [ "$USE_COMPOSE" = true ]; then
    print_status "Deploying with Docker Compose..."
    docker-compose down 2>/dev/null || true
    docker-compose up -d
else
    print_status "Deploying with Docker..."
    docker run -d \
        --name $APP_NAME \
        --restart unless-stopped \
        -p $PORT:80 \
        $IMAGE_NAME
fi

# Wait for container to be ready
print_status "Waiting for application to start..."
sleep 10

print_status "Application deployment completed!"
echo ""
echo -e "${GREEN}🎉 PolyDraw is now accessible at:${NC}"
echo -e "${BLUE}   http://localhost:$PORT${NC}"
echo -e "${BLUE}   http://YOUR_SERVER_IP:$PORT${NC}"
echo ""
echo -e "${YELLOW}Management commands:${NC}"
if [ "$USE_COMPOSE" = true ]; then
    echo "  Stop:    docker-compose down"
    echo "  Restart: docker-compose restart"
    echo "  Logs:    docker-compose logs -f"
else
    echo "  Stop:    docker stop $APP_NAME"
    echo "  Restart: docker restart $APP_NAME"
    echo "  Logs:    docker logs -f $APP_NAME"
fi 