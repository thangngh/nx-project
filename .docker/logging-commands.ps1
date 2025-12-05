# Logging Stack Management PowerShell Script
# Compatible with Windows

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Parameter
)

$ComposeFile = "docker-compose.logging.yaml"
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Red
}

function Start-LoggingStack {
    Write-Host "🚀 Starting Logging Stack..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile up -d
    Write-Success "Logging stack started!"
    Write-Host ""
    Write-Host "📊 Access Grafana at: http://localhost:3000 (admin/admin)" -ForegroundColor Cyan
    Write-Host "📝 Loki API at: http://localhost:3100" -ForegroundColor Cyan
}

function Start-WithTest {
    Write-Host "🧪 Starting Logging Stack with Test Log Generator..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile --profile testing up -d
    Write-Success "Logging stack with test generator started!"
}

function Stop-LoggingStack {
    Write-Host "🛑 Stopping Logging Stack..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile down
    Write-Success "Logging stack stopped!"
}

function Restart-LoggingStack {
    Write-Host "🔄 Restarting Logging Stack..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile restart
    Write-Success "Logging stack restarted!"
}

function Show-Logs {
    param([string]$Service)
    if ($Service) {
        docker-compose -f $ComposeFile logs -f $Service
    } else {
        docker-compose -f $ComposeFile logs -f
    }
}

function Show-Status {
    Write-Host "📊 Checking Logging Stack Status..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile ps
    
    Write-Host ""
    Write-Host "🏥 Health Checks:" -ForegroundColor Cyan
    
    # Check Loki
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3100/ready" -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Success "Loki is healthy"
    } catch {
        Write-Error-Custom "Loki is not responding"
    }
    
    # Check Grafana
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Success "Grafana is healthy"
    } catch {
        Write-Error-Custom "Grafana is not responding"
    }
}

function Remove-LoggingStack {
    Write-Host "🧹 Cleaning up Logging Stack..." -ForegroundColor Cyan
    Write-Warning-Custom "This will remove all volumes and data!"
    $confirmation = Read-Host "Are you sure? (y/N)"
    
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        docker-compose -f $ComposeFile down -v
        Write-Success "Cleanup completed!"
    } else {
        Write-Host "Cleanup cancelled."
    }
}

function Backup-Grafana {
    $BackupDir = "./backups"
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    
    Write-Host "💾 Backing up Grafana dashboards..." -ForegroundColor Cyan
    docker exec grafana grafana-cli admin export-dashboard | Out-File "$BackupDir/grafana-dashboards-$Timestamp.json"
    Write-Success "Backup saved to $BackupDir/grafana-dashboards-$Timestamp.json"
}

function Show-Metrics {
    Write-Host "📈 Loki Metrics:" -ForegroundColor Cyan
    try {
        $metrics = Invoke-WebRequest -Uri "http://localhost:3100/metrics" -UseBasicParsing
        $metrics.Content | Select-String -Pattern "loki_ingester_streams|loki_distributor_bytes_received"
    } catch {
        Write-Error-Custom "Failed to fetch metrics"
    }
}

function Test-LokiQuery {
    param([string]$Query = '{job="docker"}')
    
    Write-Host "🔍 Testing Loki Query: $Query" -ForegroundColor Cyan
    try {
        $encodedQuery = [System.Web.HttpUtility]::UrlEncode($Query)
        $response = Invoke-WebRequest -Uri "http://localhost:3100/loki/api/v1/query?query=$encodedQuery" -UseBasicParsing
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } catch {
        Write-Error-Custom "Query failed: $_"
    }
}

function Show-Help {
    Write-Host "🔧 Logging Stack Management CLI" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\logging-commands.ps1 {command} [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  start        - Start the logging stack"
    Write-Host "  start-test   - Start with test log generator"
    Write-Host "  stop         - Stop the logging stack"
    Write-Host "  restart      - Restart the logging stack"
    Write-Host "  logs [svc]   - View logs (optional: specific service)"
    Write-Host "  status       - Check health status"
    Write-Host "  cleanup      - Remove all volumes and data"
    Write-Host "  backup       - Backup Grafana dashboards"
    Write-Host "  metrics      - Show Loki metrics"
    Write-Host "  query [q]    - Test Loki query"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\logging-commands.ps1 start"
    Write-Host "  .\logging-commands.ps1 logs grafana"
    Write-Host "  .\logging-commands.ps1 query '{job=""docker""}'"
}

# Main switch
switch ($Command) {
    "start" { Start-LoggingStack }
    "start-test" { Start-WithTest }
    "stop" { Stop-LoggingStack }
    "restart" { Restart-LoggingStack }
    "logs" { Show-Logs -Service $Parameter }
    "status" { Show-Status }
    "cleanup" { Remove-LoggingStack }
    "backup" { Backup-Grafana }
    "metrics" { Show-Metrics }
    "query" { Test-LokiQuery -Query $Parameter }
    default { Show-Help }
}
