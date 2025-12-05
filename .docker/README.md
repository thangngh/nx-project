# 🏗️ Infrastructure & Logging Stack

## 📁 Structure

```
.docker/
├── Infrastructure (Main)
│   ├── docker-compose.yaml              # Main infrastructure stack
│   └── INFRASTRUCTURE.md                # 📘 Infrastructure guide
│
├── Logging Stack
│   ├── docker-compose.logging.yaml      # Basic logging (Promtail→Loki→Grafana)
│   ├── docker-compose.logging-ha.yaml   # HA logging (with Kafka + Monitoring)
│   │
│   ├── Loki Configs
│   │   ├── loki-config.yaml            # Basic Loki config
│   │   └── loki-ha-config.yaml         # HA Loki config (WAL, read/write split)
│   │
│   ├── Promtail Configs
│   │   ├── promtail-config.yaml        # Direct to Loki (with WAL)
│   │   └── promtail-kafka-config.yaml  # Via Kafka buffer
│   │
│   ├── Monitoring
│   │   ├── prometheus-logging.yaml     # Prometheus config
│   │   ├── prometheus-alerts.yaml      # Alert rules (CPU/RAM/Disk)
│   │   └── alertmanager-config.yaml    # Alert routing
│   │
│   ├── Grafana
│   │   └── grafana-datasources.yaml    # Auto-provision Loki datasource
│   │
│   └── Management
│       ├── logging-commands.sh         # Bash management script
│       └── logging-commands.ps1        # PowerShell management script
│
└── Documentation
    ├── LOGGING_RELIABILITY.md          # 📘 Reliability & zero data loss
    └── MONITORING_THRESHOLDS.md        # 📘 Resource monitoring thresholds
```

---

## 🚀 Quick Start

### Option 1: Basic Logging (Development/SME)
```bash
cd .docker
docker-compose -f docker-compose.logging.yaml up -d
```
**Access:** http://localhost:3000 (admin/admin)

### Option 2: HA Logging (Enterprise/Production)
```bash
# 1. Start Kafka first
docker-compose up -d kafka zookeeper

# 2. Create Kafka topic
docker exec kafka kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic logging-events \
  --partitions 6 \
  --replication-factor 3

# 3. Start HA logging stack
docker-compose -f docker-compose.logging-ha.yaml up -d
```

---

## 📊 Stack Comparison

| Feature | Basic | HA (with Kafka) |
|---------|-------|-----------------|
| **Reliability** | 99.9% | 99.99% |
| **Throughput** | 50K logs/s | 500K logs/s |
| **Buffer** | 1-2 hours (WAL) | 7 days (Kafka) |
| **Monitoring** | Basic | Full (Prometheus + Alerts) |
| **Complexity** | Low | Medium |
| **Best for** | < 1M logs/day | > 1M logs/day |

---

## 🔗 Services

### Basic Stack
- **Grafana**: http://localhost:3000 (UI)
- **Loki**: http://localhost:3100 (API)
- **Promtail**: http://localhost:9080 (Metrics)

### HA Stack (Additional)
- **Prometheus**: http://localhost:9090 (Metrics & Alerts)
- **Alertmanager**: http://localhost:9093 (Alert routing)
- **Node Exporter**: http://localhost:9100 (Host metrics)

---

## 📚 Documentation

### Essential Reads:
1. **INFRASTRUCTURE.md** - Main infrastructure overview
2. **LOGGING_RELIABILITY.md** - Reliability & data loss prevention
3. **MONITORING_THRESHOLDS.md** - CPU/RAM/Disk alert thresholds

### Key Concepts:
- **WAL (Write-Ahead Log)**: Ensures no data loss during outages
- **Kafka Buffering**: 7-day retention for guaranteed delivery
- **Resource Monitoring**: Automatic alerts for CPU/RAM/Disk

---

## ⚙️ Configuration

All configs use environment variables from `.env`:
```env
DATA_PATH=./data              # Data storage location
ENVIRONMENT=production        # Environment label
GRAFANA_ADMIN_PASSWORD=admin  # Grafana password
SLACK_WEBHOOK_URL=...         # Slack notifications (optional)
```

---

## 🛠️ Management Commands

### PowerShell (Windows):
```powershell
.\logging-commands.ps1 start    # Start stack
.\logging-commands.ps1 status   # Check status
.\logging-commands.ps1 logs     # View logs
.\logging-commands.ps1 stop     # Stop stack
```

### Bash (Linux/Mac):
```bash
./logging-commands.sh start
./logging-commands.sh status
./logging-commands.sh logs
./logging-commands.sh stop
```

---

## 📊 Data Persistence

Data stored in `./data/` (gitignored):
```
data/
├── loki/              # Loki chunks & indexes
├── loki/wal/          # Loki WAL (data integrity)
├── grafana/           # Grafana dashboards & settings
├── promtail/          # Promtail positions
├── promtail-wal/      # Promtail WAL (buffer)
├── prometheus/        # Prometheus metrics
└── alertmanager/      # Alert state
```

---

## 🎯 When to Use What

### Use Basic Stack when:
- ✅ Development/staging environment
- ✅ < 1M logs per day
- ✅ Simple setup needed
- ✅ Budget constraints

### Use HA Stack when:
- ✅ Production environment
- ✅ > 1M logs per day
- ✅ Zero data loss requirement
- ✅ Need 99.99% reliability
- ✅ Advanced monitoring required

---

## 🔧 Integration with NestJS

See `libs/ts/logger/README.md` for:
- JsonLoggerService usage
- LoggingMiddleware setup
- Distributed tracing
- Best practices

---

## 📞 Support

For issues or questions:
1. Check documentation in `LOGGING_RELIABILITY.md`
2. Review `INFRASTRUCTURE.md` for overall architecture
3. Check `MONITORING_THRESHOLDS.md` for alert details

---

**Built with:** Grafana + Loki + Promtail + Kafka + Prometheus + Alertmanager
