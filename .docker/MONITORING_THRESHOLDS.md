# 📊 Resource Monitoring & Alert Thresholds

## 🎯 Overview

Monitoring configuration với **ngưỡng cảnh báo** rõ ràng cho:
- ✅ CPU usage
- ✅ Memory (RAM)
- ✅ Disk space
- ✅ Disk I/O
- ✅ Inodes (quan trọng cho logging!)

---

## ⚙️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MONITORING STACK                         │
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐│
│  │ Node Exporter│────▶│  Prometheus  │────▶│ Alertmanager ││
│  │   (Metrics)  │     │   (Rules)    │     │   (Notify)   ││
│  └──────────────┘     └──────────────┘     └──────────────┘│
│         │                     │                     │        │
│         │                     │                     │        │
│         ▼                     ▼                     ▼        │
│    /proc, /sys          Evaluate          Slack, Email      │
│    CPU, RAM, Disk       Thresholds        PagerDuty         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Alert Thresholds Summary

### CPU Alerts

| Alert | Threshold | Duration | Severity | Action |
|-------|-----------|----------|----------|--------|
| **High CPU** | > 70% | 5 min | ⚠️ Warning | Investigate |
| **Critical CPU** | > 90% | 2 min | 🚨 Critical | Scale/Optimize |
| **Loki High CPU** | > 80% | 10 min | ⚠️ Warning | Check queries |
| **Promtail High CPU** | > 50% | 10 min | ⚠️ Warning | Check parsing |
| **Kafka High CPU** | > 80% | 10 min | ⚠️ Warning | Check consumers |

**Rationale:**
- 70% = Warning để có thời gian investigate
- 90% = Critical - system có thể bị degraded
- Service-specific thresholds dựa trên expected usage patterns

---

### Memory (RAM) Alerts

| Alert | Threshold | Duration | Severity | Action |
|-------|-----------|----------|----------|--------|
| **High Memory** | > 80% | 5 min | ⚠️ Warning | Check processes |
| **Critical Memory** | > 95% | 2 min | 🚨 Critical | OOM risk! |
| **Loki Memory** | > 4GB | 10 min | ⚠️ Warning | Tune config |
| **Grafana Memory** | > 2GB | 10 min | ⚠️ Warning | Restart needed? |
| **Kafka Memory** | > 8GB | 10 min | ⚠️ Warning | Check heap |
| **Memory Leak** | +10MB/hour | 6 hours | ⚠️ Warning | Code review |

**Rationale:**
- 80% = Warning - còn buffer
- 95% = Critical - OOM killer có thể trigger
- Per-service thresholds dựa trên typical footprint
- Memory leak detection: continuous growth trong 6h

---

### Disk Space Alerts

| Alert | Threshold | Duration | Severity | Action |
|-------|-----------|----------|----------|--------|
| **Disk Warning** | > 75% | 10 min | ⚠️ Warning | Plan cleanup |
| **Disk Critical** | > 90% | 5 min | 🚨 Critical | Cleanup NOW! |
| **Disk Full in 4h** | Linear prediction | 10 min | ⚠️ Warning | Proactive |
| **Loki Disk** | > 70% | 10 min | ⚠️ Warning | Adjust retention |
| **Kafka Disk** | > 70% | 10 min | ⚠️ Warning | Clean old segments |

**Rationale:**
- 75% = Warning - thời gian để plan
- 90% = Critical - services có thể fail
- Predictive alerting: catch before full
- Lower thresholds cho Loki/Kafka vì chúng grow fast

---

### Disk I/O Alerts

| Alert | Threshold | Duration | Severity | Action |
|-------|-----------|----------|----------|--------|
| **High Disk I/O** | > 90% util | 10 min | ⚠️ Warning | Check workload |
| **Disk Errors** | > 0 errors/s | 5 min | 🚨 Critical | Hardware issue! |

**Rationale:**
- 90% I/O utilization = disk bottleneck
- ANY disk errors = potential hardware failure

---

### Inode Alerts (Critical cho logging!)

| Alert | Threshold | Duration | Severity | Action |
|-------|-----------|----------|----------|--------|
| **High Inodes** | > 80% | 10 min | ⚠️ Warning | Too many files |
| **Critical Inodes** | > 95% | 5 min | 🚨 Critical | Can't create files! |

**Rationale:**
- Logging systems tạo nhiều small files
- Inode exhaustion = không thể create files dù còn disk space
- 80% = warning để cleanup
- 95% = critical - sắp hết

---

## 🔧 Configuration Details

### Node Exporter

Collects host-level metrics:

```yaml
# docker-compose.logging-ha.yaml
node-exporter:
  image: prom/node-exporter:latest
  ports:
    - "9100:9100"
  volumes:
    - /proc:/host/proc:ro
    - /sys:/host/sys:ro
    - /:/host/root:ro
```

**Metrics exposed:**
- `node_cpu_seconds_total` - CPU usage per core
- `node_memory_MemAvailable_bytes` - Available RAM
- `node_filesystem_avail_bytes` - Disk space
- `node_filesystem_files_free` - Free inodes
- `node_disk_io_time_seconds_total` - Disk I/O
- `node_disk_read_errors_total` - Disk errors

**Access:** http://localhost:9100/metrics

---

### Prometheus

Scrapes metrics & evaluates alert rules:

```yaml
# prometheus-logging.yaml
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s
```

**Alert Rules:** `prometheus-alerts.yaml`

**Access:** http://localhost:9090

---

### Alertmanager

Routes alerts to notification channels:

```yaml
# alertmanager-config.yaml
receivers:
  - name: 'critical-alerts'
    slack_configs:
      - channel: '#alerts-critical'
        title: '🚨 CRITICAL Alert'
```

**Access:** http://localhost:9093

---

## 📈 Alert Examples

### Example 1: High CPU Alert

```yaml
- alert: HighCPUUsage
  expr: |
    100 - (avg(rate(node_exporter_cpu_seconds_total{mode="idle"}[5m])) * 100) > 70
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage"
    description: "CPU at {{ $value }}%"
```

**Triggers when:**
- CPU usage > 70%
- Sustained for 5 minutes
- Sends warning notification

---

### Example 2: Disk Space Critical

```yaml
- alert: DiskSpaceCritical
  expr: |
    (1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100 > 90
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "🚨 Disk space critical!"
    description: "Disk {{ $labels.mountpoint }} is {{ $value }}% full"
```

**Triggers when:**
- Any mounted filesystem > 90% full
- Sustained for 5 minutes
- Sends CRITICAL alert

---

### Example 3: Memory Leak Detection

```yaml
- alert: PossibleMemoryLeak
  expr: |
    rate(process_resident_memory_bytes[1h]) > 10485760  # 10MB/hour
  for: 6h
  labels:
    severity: warning
  annotations:
    summary: "Possible memory leak in {{ $labels.job }}"
```

**Triggers when:**
- Memory grows > 10MB/hour
- Continuous growth for 6 hours
- Indicates potential memory leak

---

## 🚦 Alert Severity Levels

### ⚠️ WARNING
- **Threshold:** Approaching limits
- **Action time:** Hours to days
- **Response:** Investigate, plan action
- **Examples:** 70% CPU, 80% RAM, 75% Disk

### 🚨 CRITICAL
- **Threshold:** At or near limits
- **Action time:** Minutes to hours
- **Response:** Immediate intervention
- **Examples:** 90% CPU, 95% RAM, 90% Disk, Disk errors

---

## 📊 Monitoring Dashboard

### Prometheus Queries

#### CPU Usage
```promql
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

#### Memory Usage
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

#### Disk Usage
```promql
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

#### Disk I/O
```promql
rate(node_disk_io_time_seconds_total[5m])
```

---

## 🎯 Best Practices

### 1. **Tiered Alerting**
- ✅ WARNING at 70-80% → time to investigate
- ✅ CRITICAL at 90-95% → immediate action
- ✅ Avoid alert fatigue với appropriate thresholds

### 2. **Alert Grouping**
- ✅ Group by severity
- ✅ Group by service
- ✅ Avoid duplicate notifications

### 3. **Notification Channels**
- ✅ Slack for warnings
- ✅ PagerDuty for critical (24/7)
- ✅ Email for summaries

### 4. **Alert Tuning**
- ✅ Monitor alert frequency
- ✅ Adjust thresholds based on actual usage
- ✅ Add "for" duration để avoid flapping

### 5. **Documentation**
- ✅ Document expected thresholds
- ✅ Runbooks cho mỗi alert
- ✅ Post-mortem sau incidents

---

## 🛠️ Troubleshooting

### High CPU
```bash
# Find top CPU processes
docker exec -it <container> top

# Check Loki query load
curl http://localhost:3100/metrics | grep loki_request

# Scale if needed
docker-compose scale loki-read=2
```

### High Memory
```bash
# Check memory usage
docker stats

# Restart service to free memory
docker restart <service>

# Tune heap size (Kafka example)
KAFKA_HEAP_OPTS: "-Xmx4G -Xms4G"
```

### Disk Full
```bash
# Find large files
du -sh /path/to/data/* | sort -h

# Clean old logs
find ./data/loki -mtime +7 -delete

# Adjust retention
# loki-config.yaml: retention_period: 168h
```

### Inode Exhaustion
```bash
# Find directories with many files
find ./data -xdev -printf '%h\n' | sort | uniq -c | sort -k 1 -n

# Remove small temp files
find ./data -type f -size 0 -delete
```

---

## ✅ Checklist

Before deploying to production:

- [ ] Node Exporter deployed
- [ ] Prometheus scraping metrics
- [ ] Alert rules configured
- [ ] Alertmanager configured
- [ ] Notification channels tested
- [ ] Thresholds tuned for your environment
- [ ] Runbooks documented
- [ ] Team trained on alerts

---

## 📚 Resources

- Prometheus Alerting: https://prometheus.io/docs/alerting/
- Node Exporter: https://github.com/prometheus/node_exporter
- Alert Manager: https://prometheus.io/docs/alerting/alertmanager/
- PromQL: https://prometheus.io/docs/prometheus/latest/querying/basics/

---

**Monitoring is crucial! Don't wait for outages! 🚨📊**
