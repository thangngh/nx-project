# 🏗️ Infrastructure Services Documentation

## Tổng Quan Kiến Trúc

Hệ thống được thiết kế theo nguyên tắc **Single Responsibility Principle (SRP)**, mỗi service chỉ đảm nhiệm một nhiệm vụ duy nhất để đảm bảo khả năng mở rộng, bảo trì và hiệu suất tối ưu.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Gateway   │  │ User Service│  │Order Service│  │  ...Others  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
└─────────┼────────────────┼────────────────┼────────────────┼────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE LAYER                             │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     MESSAGE QUEUE (Kafka)                        │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                    │    │
│  │  │ Zookeeper │──│   Kafka   │──│ Kafka-UI  │                    │    │
│  │  └───────────┘  └───────────┘  └───────────┘                    │    │
│  │  Nhiệm vụ: Message Broker, Event Streaming, Service Decoupling  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │
│  │     Redis     │  │   MongoDB     │  │   Postgres    │                │
│  │   (Cache &    │  │ (Event Store) │  │ (Read Model)  │                │
│  │   Snapshot)   │  │               │  │               │                │
│  └───────────────┘  └───────────────┘  └───────────────┘                │
│                                                                          │
│  ┌───────────────┐                                                       │
│  │     MinIO     │                                                       │
│  │(Object Storage)│                                                      │
│  └───────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Chi Tiết Từng Service

### 1. Zookeeper
| Thuộc tính | Giá trị |
|------------|---------|
| **Image** | `confluentinc/cp-zookeeper:7.5.0` |
| **Port** | `2181` |
| **Network** | `message-queue` |
| **Data Volume** | `${DATA_PATH}/zookeeper` |

**Nhiệm vụ:**
- Quản lý cluster Kafka (leader election, configuration management)
- Lưu trữ metadata của Kafka brokers
- Đồng bộ hóa giữa các nodes trong cluster

**Lưu ý:** Zookeeper đang dần được thay thế bởi KRaft mode trong Kafka phiên bản mới.

---

### 2. Kafka
| Thuộc tính | Giá trị |
|------------|---------|
| **Image** | `confluentinc/cp-kafka:7.5.0` |
| **Ports** | `9092` (external), `29092` (internal) |
| **Network** | `message-queue` |
| **Data Volume** | `${DATA_PATH}/kafka` |
| **Depends On** | `zookeeper` |

**Nhiệm vụ:**
- **Message Broker**: Điều phối giao tiếp giữa các microservices
- **Event Streaming**: Xử lý luồng sự kiện real-time
- **Service Decoupling**: Tách rời các services, đảm bảo loose coupling
- **Pub/Sub Pattern**: Hỗ trợ mô hình Publisher-Subscriber

**Cấu hình quan trọng:**
```yaml
KAFKA_AUTO_CREATE_TOPICS_ENABLE: true  # Tự động tạo topic khi có producer gửi message
KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1  # Dành cho môi trường dev (production nên >= 3)
```

**Kết nối từ Application:**
```typescript
// Từ bên trong Docker network
bootstrap: 'kafka:29092'

// Từ host machine (localhost)
bootstrap: 'localhost:9092'
```

---

### 3. Kafka-UI
| Thuộc tính | Giá trị |
|------------|---------|
| **Image** | `provectuslabs/kafka-ui:latest` |
| **Port** | `8080` |
| **Network** | `message-queue` |
| **Depends On** | `kafka` |

**Nhiệm vụ:**
- Giao diện web để quản lý và giám sát Kafka cluster
- Xem topics, messages, consumer groups
- Debug và troubleshoot message flow

**Truy cập:** http://localhost:8080

---

### 4. Redis
| Thuộc tính | Giá trị |
|------------|---------|
| **Image** | `redis:alpine` |
| **Port** | `6379` |
| **Network** | `redis_network` |
| **Data Volume** | `${DATA_PATH}/redis` |
| **Authentication** | `${REDIS_PASSWORD}` (default: `root`) |

**Nhiệm vụ (DUY NHẤT):**
- **Caching**: Lưu trữ cache cho application
- **Snapshot Storage**: Lưu trữ bản snapshot mới nhất của Aggregate trong Event Sourcing

**KHÔNG sử dụng cho:**
- ❌ Session storage (nên dùng JWT stateless)
- ❌ Message queue (đã có Kafka)
- ❌ Persistent data (dùng MongoDB/Postgres)

**Cấu hình:**
```yaml
command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
```
- `--appendonly yes`: Bật AOF persistence để đảm bảo dữ liệu không mất khi restart

**Kết nối từ Application:**
```typescript
// NestJS với ioredis
{
  host: 'localhost', // hoặc 'redis' nếu trong Docker
  port: 6379,
  password: 'root'
}
```

---

### 5. MongoDB
| Thuộc tính | Giá trị |
|------------|---------|
| **Image** | `mongo:6.0` |
| **Port** | `27017` |
| **Network** | `mongodb_network` |
| **Data Volume** | `${DATA_PATH}/mongodb` |
| **Authentication** | `${MONGO_INITDB_ROOT_USERNAME}` / `${MONGO_INITDB_ROOT_PASSWORD}` (default: `root/root`) |

**Nhiệm vụ (DUY NHẤT):**
- **Event Store**: Lưu trữ tất cả Domain Events một cách bền vững
- **Audit Trail**: Giữ lại toàn bộ lịch sử thay đổi của hệ thống

**KHÔNG sử dụng cho:**
- ❌ Read models (dùng Postgres)
- ❌ Session/Cache (dùng Redis)
- ❌ File storage (dùng MinIO)

**Schema đề xuất cho Event Store:**
```typescript
interface StoredEvent {
  _id: ObjectId;
  aggregateId: string;        // ID của đối tượng (User, Order, ...)
  aggregateType: string;      // Loại đối tượng ('User', 'Order', ...)
  eventType: string;          // Loại event ('UserCreated', 'OrderPlaced', ...)
  version: number;            // Số thứ tự của event
  payload: object;            // Dữ liệu của event
  metadata: {
    correlationId: string;
    causationId: string;
    userId: string;
    timestamp: Date;
  };
  createdAt: Date;
}
```

**Index quan trọng:**
```javascript
db.events.createIndex({ aggregateId: 1, version: 1 }, { unique: true })
db.events.createIndex({ aggregateType: 1, createdAt: -1 })
```

**Kết nối từ Application:**
```typescript
// Connection string
mongodb://root:root@localhost:27017/event_store?authSource=admin
```

---

### 6. PostgreSQL
| Thuộc tính | Giá trị |
|------------|---------|
| **Image** | `postgres:15` |
| **Port** | `5432` |
| **Network** | `postgres_network_1` |
| **Data Volume** | `${DATA_PATH}/postgres-1` |
| **Authentication** | `${POSTGRES_USER}` / `${POSTGRES_PASSWORD}` (default: `postgres/postgres`) |

**Nhiệm vụ (DUY NHẤT):**
- **Read Model / Query Database**: Lưu trữ dữ liệu đã được "project" từ Events
- **Reporting**: Phục vụ các truy vấn phức tạp, báo cáo, thống kê
- **CQRS Query Side**: Là database cho "Q" trong CQRS pattern

**KHÔNG sử dụng cho:**
- ❌ Event Store (dùng MongoDB)
- ❌ Cache (dùng Redis)
- ❌ Message queue (dùng Kafka)

**Healthcheck:**
```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

**Kết nối từ Application:**
```typescript
// TypeORM config
{
  type: 'postgres',
  host: 'localhost', // hoặc 'postgres-1' nếu trong Docker
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'postgres'
}
```

---

### 7. MinIO
| Thuộc tính | Giá trị |
|------------|---------|
| **Image** | `minio/minio` |
| **Ports** | `9000` (API), `9001` (Console) |
| **Network** | `minio_network` |
| **Data Volume** | `${DATA_PATH}/minio` |
| **Authentication** | `admin` / `123456789` |

**Nhiệm vụ (DUY NHẤT):**
- **Object Storage**: Lưu trữ files, images, documents
- **S3-Compatible**: API tương thích với AWS S3

**KHÔNG sử dụng cho:**
- ❌ Database (dùng Postgres/MongoDB)
- ❌ Cache (dùng Redis)

**Truy cập Console:** http://localhost:9001

---

### 8. RabbitMQ
| Thuộc tính | Giá trị |
|------------|---------|
| **Image** | `rabbitmq:3.13-management-alpine` |
| **Ports** | `5672` (AMQP), `15672` (Management UI) |
| **Network** | `rabbitmq_network` |
| **Data Volume** | `${DATA_PATH}/rabbitmq` |
| **Authentication** | `${RABBITMQ_USER}` / `${RABBITMQ_PASSWORD}` (default: `admin/admin123`) |

**Nhiệm vụ (DUY NHẤT):**
- **Task Queue**: Hàng đợi công việc cho background jobs
- **Job Distribution**: Phân phối công việc cho multiple workers
- **Retry & Dead Letter Queue**: Tự động retry và xử lý failed jobs

**Tại sao cần RabbitMQ khi đã có Kafka?**

| Tiêu chí | RabbitMQ | Kafka |
|----------|----------|-------|
| **Use case** | Job Queue, Task Processing | Event Streaming, Log |
| **Delivery** | At-least-once với ACK | At-least-once với offset |
| **Priority** | ✅ Built-in | ❌ Không có |
| **Dead Letter** | ✅ Native | ⚠️ Manual setup |
| **Retry** | ✅ Easy | ⚠️ Complex |

**Queues được định nghĩa:**
```
pdf-export       → Export PDF hàng loạt (invoices, reports)
csv-import       → Import CSV bulk (products, users)
email-send       → Gửi email async
report-generation → Tạo báo cáo phức tạp
image-resize     → Resize ảnh background
notifications    → Push notifications
```

**Truy cập Management UI:** http://localhost:15672

**Kết nối từ Application:**
```typescript
// NestJS với @nestjs/microservices
{
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://admin:admin123@localhost:5672'],
    queue: 'pdf-export',
    queueOptions: { durable: true }
  }
}
```

---

### 9. Worker Engine (Golang)
| Thuộc tính | Giá trị |
|------------|---------|
| **Language** | `Go 1.23` |
| **Port** | `3002` (health check only) |
| **Networks** | `rabbitmq_network`, `minio_network`, `postgres_network_1`, `mongodb_network` |
| **Depends On** | `rabbitmq`, `minio`, `postgres-1`, `mongodb` |

**Nhiệm vụ (DUY NHẤT):**
- **Background Job Processing**: Xử lý các công việc nặng trong background
- **PDF Export**: Export hàng loạt invoices, reports sang PDF
- **CSV Import**: Import dữ liệu từ CSV với streaming (không load toàn bộ vào memory)
- **Batch Processing**: Xử lý dữ liệu theo batch để tối ưu performance

**Tại sao Worker riêng biệt với File Engine?**
- **File Engine**: Xử lý upload/download realtime, response ngay
- **Worker Engine**: Xử lý async, có thể mất vài phút hoặc vài giờ

**Workflow:**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│   Gateway    │────▶│   RabbitMQ   │
│              │     │   (NestJS)   │     │   (Queue)    │
└──────────────┘     └──────────────┘     └──────┬───────┘
       │                    │                     │
       │              Return job_id               │
       │◀─────────────────────                   │
       │                                          ▼
       │                              ┌──────────────────┐
       │                              │  Worker Engine   │
       │                              │     (Golang)     │
       │                              └────────┬─────────┘
       │                                       │
       │                              ┌────────┼────────┐
       │                              ▼        ▼        ▼
       │                           Process  Query DB  Upload
       │                            Data              to MinIO
       │                                       │
       │                              ┌────────┴────────┐
       │ Poll GET /jobs/{id}          │                 │
       │◀─────────────────────────────┤  Status: DONE   │
       │                              │  Download URL   │
       │                              └─────────────────┘
```

**Queues được xử lý:**
| Queue | Job Types | Mô tả |
|-------|-----------|-------|
| `pdf-export` | `pdf.export.invoices`, `pdf.export.report` | Export PDF |
| `csv-import` | `csv.import.products`, `csv.import.users` | Import CSV |

**Cấu hình Environment:**
```env
WORKER_CONCURRENCY=5      # Số worker concurrent
RABBITMQ_URL=amqp://...   # RabbitMQ connection
MINIO_ENDPOINT=...        # MinIO for file output
POSTGRES_HOST=...         # Query data từ DB
MONGODB_URI=...           # Event store (nếu cần)
```

**Scale Workers:**
```bash
# Scale lên 3 instances
docker-compose up -d --scale worker-engine=3
```

---

### 10. File Engine (Golang)
| Thuộc tính | Giá trị |
|------------|---------|
| **Language** | `Go 1.23` |
| **Port** | `3001` |
| **Networks** | `minio_network`, `file_engine_network` |
| **Depends On** | `minio` |

**Nhiệm vụ (DUY NHẤT):**
- **File Processing**: Xử lý upload/download files với hiệu suất cao
- **Thumbnail Generation**: Tự động tạo thumbnail cho images
- **Presigned URL**: Tạo URL có thời hạn cho download/upload
- **Streaming**: Stream file trực tiếp mà không load vào memory

**Tại sao sử dụng Golang?**
- ⚡ Compiled language → Performance cao
- 🔄 Native concurrency (Goroutines) → Xử lý song song tốt
- 📦 Single binary → Deploy đơn giản
- 💾 Low memory footprint (~10-50MB)

**API Endpoints:**
```
POST   /api/v1/files/upload              # Upload file
POST   /api/v1/files/upload/{bucket}     # Upload to specific bucket
GET    /api/v1/files/{bucket}/{object}   # Download file
DELETE /api/v1/files/{bucket}/{object}   # Delete file
GET    /api/v1/files/{bucket}/{object}/info       # Get file info
GET    /api/v1/files/{bucket}/{object}/presigned  # Get presigned URL
GET    /api/v1/files/{bucket}/{object}/thumbnail  # Get thumbnail
GET    /api/v1/buckets                   # List buckets
GET    /api/v1/buckets/{bucket}/objects  # List objects

# Health checks
GET    /health       # Overall health
GET    /health/ready # Kubernetes readiness
GET    /health/live  # Kubernetes liveness
```

**Cấu hình Environment:**
```env
SERVER_PORT=3001
LOG_LEVEL=info
LOG_FORMAT=json
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=123456789
MINIO_USE_SSL=false
MINIO_REGION=us-east-1
MINIO_DEFAULT_BUCKET=uploads
UPLOAD_MAX_FILE_SIZE=104857600    # 100MB
THUMBNAIL_MAX_SIZE=200
THUMBNAIL_QUALITY=80
```

**Cấu trúc thư mục Golang:**
```
nx-project/
├── go.work                          # Go workspace
├── apps/
│   └── file-engine/                 # Main application
│       ├── cmd/main.go
│       ├── internal/
│       │   ├── config/
│       │   ├── handlers/
│       │   └── services/
│       ├── Dockerfile
│       └── go.mod
└── libs/golang/                     # Shared libraries
    ├── common/                      # Logger, Config, Errors
    ├── minio-client/               # MinIO wrapper
    └── image-processor/            # Image manipulation
```

**Build & Run:**
```bash
# Development
cd apps/file-engine
go run ./cmd/main.go

# Build binary
go build -o bin/file-engine ./cmd/main.go

# Build Docker image
docker build -t file-engine:latest -f apps/file-engine/Dockerfile .
```

---

## 🔄 Event Sourcing Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Command    │────▶│   MongoDB    │────▶│    Kafka     │
│   Handler    │     │ (Event Store)│     │  (Publish)   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌────────────────────────────┼────────────────────────────┐
                     │                            │                            │
                     ▼                            ▼                            ▼
              ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
              │   Projector  │           │   Projector  │           │   Projector  │
              │   (User)     │           │   (Order)    │           │   (Report)   │
              └──────┬───────┘           └──────┬───────┘           └──────┬───────┘
                     │                          │                          │
                     ▼                          ▼                          ▼
              ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
              │  PostgreSQL  │           │  PostgreSQL  │           │  PostgreSQL  │
              │ (Read Model) │           │ (Read Model) │           │ (Read Model) │
              └──────────────┘           └──────────────┘           └──────────────┘
```

### Replay Event với Low Latency

```
┌──────────────────────────────────────────────────────────────────────┐
│                         AGGREGATE LOADING                             │
│                                                                       │
│  1. Check Redis for Snapshot                                         │
│     ┌─────────┐                                                      │
│     │  Redis  │ ──▶ Snapshot found? (version: 100)                   │
│     └─────────┘      │                                               │
│                      │ YES ──▶ Load state from snapshot              │
│                      │ NO  ──▶ Start with empty state (version: 0)   │
│                      ▼                                               │
│  2. Load Events from MongoDB (version > snapshot_version)            │
│     ┌─────────┐                                                      │
│     │ MongoDB │ ──▶ SELECT * FROM events                             │
│     └─────────┘      WHERE aggregateId = ? AND version > 100         │
│                      ORDER BY version ASC                            │
│                      ▼                                               │
│  3. Apply Events to State                                            │
│     for each event:                                                  │
│       state = apply(state, event)                                    │
│                      ▼                                               │
│  4. (Async) Create new Snapshot if needed                            │
│     if (events_applied > THRESHOLD):                                 │
│       save_snapshot_to_redis(aggregateId, state, current_version)    │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Khởi Động

### Khởi động tất cả services:
```bash
cd .docker
docker-compose up -d
```

### Khởi động từng service:
```bash
# Message Queue
docker-compose up -d zookeeper kafka kafka-ui

# Databases
docker-compose up -d redis mongodb postgres-1

# Object Storage
docker-compose up -d minio
```

### Xem logs:
```bash
docker-compose logs -f <service-name>
```

### Dừng services:
```bash
docker-compose down
```

### Xóa data (CẢNH BÁO: Mất hết dữ liệu):
```bash
docker-compose down -v
rm -rf ./data
```

---

## 🔧 Cấu Hình Biến Môi Trường

File `.env` trong thư mục `.docker`:

```env
# Data storage path
DATA_PATH=./data

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres

# Redis
REDIS_PASSWORD=root

# MongoDB
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=root

# MinIO
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=123456789
```

---

## 📊 Ports Summary

| Service | Port | Mô tả |
|---------|------|-------|
| Zookeeper | 2181 | Kafka coordination |
| Kafka | 9092 | External broker |
| Kafka | 29092 | Internal broker |
| Kafka-UI | 8080 | Web management |
| Redis | 6379 | Cache & Snapshot |
| MongoDB | 27017 | Event Store |
| PostgreSQL | 5432 | Read Model |
| MinIO API | 9000 | S3 API |
| MinIO Console | 9001 | Web management |
| **RabbitMQ AMQP** | **5672** | **Message Queue Protocol** |
| **RabbitMQ UI** | **15672** | **Management Console** |
| **File Engine** | **3001** | **File Processing API (Golang)** |
| **Worker Engine** | **3002** | **Background Job Processor (Golang)** |

---

## ⚠️ Lưu Ý Quan Trọng

1. **Single Responsibility**: Mỗi database CHỈ làm một nhiệm vụ duy nhất. Không mix responsibilities.

2. **Production Ready**: Cấu hình hiện tại dành cho development. Với production:
   - Tăng `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR` lên >= 3
   - Sử dụng persistent volumes
   - Cấu hình backup strategy
   - Bật SSL/TLS cho tất cả connections

3. **Networking**: Các services được tách biệt theo network để đảm bảo security. Chỉ các services cần giao tiếp mới được đặt chung network.

4. **Data Persistence**: Tất cả data được mount ra ngoài theo biến `DATA_PATH` để dễ dàng backup và di chuyển.

5. **Golang Services**: File Engine được viết bằng Golang để đảm bảo hiệu suất cao khi xử lý file. Các NestJS services nên gọi đến File Engine thay vì gọi trực tiếp MinIO.
