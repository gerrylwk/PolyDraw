#!/bin/bash

# PolyDraw Health Monitoring Script
# Simple health check for local development and testing

APP_URL="http://localhost:3000"
HEALTH_ENDPOINT="$APP_URL/health"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_health() {
    echo -e "${BLUE}🔍 Checking health endpoint...${NC}"
    
    if response=$(curl -f -s $HEALTH_ENDPOINT 2>/dev/null); then
        echo -e "${GREEN}✓ Application is healthy${NC}"
        echo -e "${GREEN}  Response: '$response'${NC}"
        echo -e "${GREEN}  Endpoint: $HEALTH_ENDPOINT${NC}"
        return 0
    else
        echo -e "${RED}✗ Application is unhealthy${NC}"
        echo -e "${RED}  Endpoint: $HEALTH_ENDPOINT${NC}"
        echo -e "${YELLOW}  Tip: Make sure the application is running with 'docker-compose up -d'${NC}"
        return 1
    fi
}

# Continuous monitoring
monitor_continuously() {
    echo -e "${BLUE}🔄 Starting continuous health monitoring...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    
    while true; do
        check_health
        echo ""
        sleep 30  # Check every 30 seconds
    done
}

# Show help
show_help() {
    echo -e "${BLUE}PolyDraw Health Monitor${NC}"
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check       - Perform a single health check (default)"
    echo "  monitor     - Monitor continuously every 30 seconds"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Single check"
    echo "  $0 check              # Single check"
    echo "  $0 monitor            # Continuous monitoring"
}

# Main logic
case "${1:-check}" in
    "check"|"single")
        check_health
        exit $?
        ;;
    "monitor"|"continuous")
        monitor_continuously
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
