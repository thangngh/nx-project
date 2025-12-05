#!/bin/bash

# Logging Stack Management Commands

COMPOSE_FILE="docker-compose.logging.yaml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to start logging stack
start_logging() {
    echo "🚀 Starting Logging Stack..."
    docker-compose -f $COMPOSE_FILE up -d
    echo_success "Logging stack started!"
    echo ""
    echo "📊 Access Grafana at: http://localhost:3000 (admin/admin)"
    echo "📝 Loki API at: http://localhost:3100"
}

# Function to start with log generator for testing
start_with_test() {
    echo "🧪 Starting Logging Stack with Test Log Generator..."
    docker-compose -f $COMPOSE_FILE --profile testing up -d
    echo_success "Logging stack with test generator started!"
}

# Function to stop logging stack
stop_logging() {
    echo "🛑 Stopping Logging Stack..."
    docker-compose -f $COMPOSE_FILE down
    echo_success "Logging stack stopped!"
}

# Function to restart logging stack
restart_logging() {
    echo "🔄 Restarting Logging Stack..."
    docker-compose -f $COMPOSE_FILE restart
    echo_success "Logging stack restarted!"
}

# Function to view logs
view_logs() {
    SERVICE=$1
    if [ -z "$SERVICE" ]; then
        docker-compose -f $COMPOSE_FILE logs -f
    else
        docker-compose -f $COMPOSE_FILE logs -f $SERVICE
    fi
}

# Function to check status
check_status() {
    echo "📊 Checking Logging Stack Status..."
    docker-compose -f $COMPOSE_FILE ps
    
    echo ""
    echo "🏥 Health Checks:"
    
    # Check Loki
    if curl -s http://localhost:3100/ready > /dev/null 2>&1; then
        echo_success "Loki is healthy"
    else
        echo_error "Loki is not responding"
    fi
    
    # Check Grafana
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo_success "Grafana is healthy"
    else
        echo_error "Grafana is not responding"
    fi
}

# Function to clean up
cleanup() {
    echo "🧹 Cleaning up Logging Stack..."
    echo_warning "This will remove all volumes and data!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f $COMPOSE_FILE down -v
        echo_success "Cleanup completed!"
    else
        echo "Cleanup cancelled."
    fi
}

# Function to backup Grafana dashboards
backup_grafana() {
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    mkdir -p $BACKUP_DIR
    
    echo "💾 Backing up Grafana dashboards..."
    docker exec grafana grafana-cli admin export-dashboard > "$BACKUP_DIR/grafana-dashboards-$TIMESTAMP.json"
    echo_success "Backup saved to $BACKUP_DIR/grafana-dashboards-$TIMESTAMP.json"
}

# Function to show Loki metrics
show_metrics() {
    echo "📈 Loki Metrics:"
    curl -s http://localhost:3100/metrics | grep -E "loki_ingester_streams|loki_distributor_bytes_received"
}

# Function to test Loki query
test_query() {
    QUERY=${1:-'{job="docker"}'}
    echo "🔍 Testing Loki Query: $QUERY"
    curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode "query=$QUERY" | jq .
}

# Main menu
case "$1" in
    start)
        start_logging
        ;;
    start-test)
        start_with_test
        ;;
    stop)
        stop_logging
        ;;
    restart)
        restart_logging
        ;;
    logs)
        view_logs "$2"
        ;;
    status)
        check_status
        ;;
    cleanup)
        cleanup
        ;;
    backup)
        backup_grafana
        ;;
    metrics)
        show_metrics
        ;;
    query)
        test_query "$2"
        ;;
    *)
        echo "🔧 Logging Stack Management CLI"
        echo ""
        echo "Usage: $0 {command} [options]"
        echo ""
        echo "Commands:"
        echo "  start        - Start the logging stack"
        echo "  start-test   - Start with test log generator"
        echo "  stop         - Stop the logging stack"
        echo "  restart      - Restart the logging stack"
        echo "  logs [svc]   - View logs (optional: specific service)"
        echo "  status       - Check health status"
        echo "  cleanup      - Remove all volumes and data"
        echo "  backup       - Backup Grafana dashboards"
        echo "  metrics      - Show Loki metrics"
        echo "  query [q]    - Test Loki query"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs grafana"
        echo "  $0 query '{job=\"docker\"}'"
        exit 1
        ;;
esac
