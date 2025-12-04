# 🚀 NX-Project Monorepo

Enterprise-grade monorepo được xây dựng với **Nx**, **NestJS**, **Next.js**, **React**, và **Golang**.

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Kiến Trúc](#kiến-trúc)
- [Cài Đặt](#cài-đặt)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
- [Tài Liệu Chi Tiết](#tài-liệu-chi-tiết)

---

## Tổng Quan

### Tech Stack

| Layer | Technology | Mục đích |
|-------|------------|----------|
| **Frontend** | Next.js 16, React 19, Vite | Portal (SEO), Admin Dashboard |
| **Backend** | NestJS 11, TypeScript | Microservices, REST/GraphQL APIs |
| **Core Engine** | Golang 1.23 | High-performance file processing |
| **Message Queue** | Apache Kafka | Event streaming, service decoupling |
| **Databases** | PostgreSQL, MongoDB, Redis | Read models, Event store, Cache |
| **Object Storage** | MinIO (S3-compatible) | File storage |
| **Tooling** | Nx 22, Yarn, Docker | Monorepo management, containerization |

### Nguyên Tắc Kiến Trúc

- ✅ **Single Responsibility**: Mỗi service/database một nhiệm vụ
- ✅ **Event Sourcing & CQRS**: Tách biệt read/write
- ✅ **Microservices**: Loose coupling, high cohesion
- ✅ **Polyglot**: TypeScript + Golang cho từng use case phù hợp

---

## Kiến Trúc

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│         Portal (Next.js)              Admin (React + Vite)              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (NestJS)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   User Service  │      │  Order Service  │      │  File Engine    │
│    (NestJS)     │      │    (NestJS)     │      │    (Golang)     │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  Kafka  │  │ Postgres│  │ MongoDB │  │  Redis  │  │  MinIO  │       │
│  │(Events) │  │ (Query) │  │(Events) │  │ (Cache) │  │ (Files) │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Cài Đặt

### Yêu Cầu

- **Node.js** >= 20.x
- **Yarn** >= 1.22
- **Go** >= 1.23 (cho File Engine)
- **Docker** & **Docker Compose**

### Bước 1: Clone và cài đặt dependencies

```bash
git clone <repository-url>
cd nx-project

# Cài đặt Node.js dependencies
yarn install

# Cài đặt Go dependencies
yarn go:tidy
```

### Bước 2: Cấu hình môi trường

```bash
# Copy file cấu hình mẫu
cp .docker/.env.example .docker/.env

# Chỉnh sửa các giá trị nếu cần
# nano .docker/.env
```

### Bước 3: Khởi động infrastructure

```bash
# Khởi động tất cả services (databases, message queue, etc.)
yarn docker:up

# Hoặc chỉ khởi động infrastructure (không build apps)
yarn docker:infra
```

---

## Quick Start

### Development

```bash
# 1. Khởi động infrastructure
yarn docker:infra

# 2. Chạy NestJS Gateway
yarn dev:gateway

# 3. Chạy Golang File Engine (terminal khác)
yarn go:file-engine:dev

# 4. Chạy Frontend Portal (terminal khác)
yarn nx serve portal

# 5. Chạy Frontend Admin (terminal khác)
yarn nx serve admin
```

### Kiểm tra services

| Service | URL |
|---------|-----|
| Gateway API | http://localhost:3000/api |
| File Engine | http://localhost:3001 |
| Portal | http://localhost:4200 |
| Admin | http://localhost:4201 |
| Kafka UI | http://localhost:8080 |
| MinIO Console | http://localhost:9001 |

---

## Scripts

### 🐳 Docker Commands

| Script | Mô tả |
|--------|-------|
| `yarn docker:up` | Khởi động tất cả containers |
| `yarn docker:down` | Dừng tất cả containers |
| `yarn docker:logs` | Xem logs (tất cả services) |
| `yarn docker:ps` | Liệt kê container status |
| `yarn docker:infra` | Chỉ khởi động infrastructure |
| `yarn docker:build` | Build lại images |

### 🔷 Golang Commands

| Script | Mô tả |
|--------|-------|
| `yarn go:file-engine:dev` | Chạy File Engine (dev mode) |
| `yarn go:file-engine:build` | Build binary |
| `yarn go:tidy` | Sync tất cả Go modules |
| `yarn docker:file-engine` | Build & run File Engine container |

### 📦 Nx Commands

| Script | Mô tả |
|--------|-------|
| `yarn dev` | Chạy app (chọn từ prompt) |
| `yarn dev:gateway` | Chạy Gateway API |
| `yarn build:all` | Build tất cả projects |
| `yarn test:all` | Test tất cả projects |
| `yarn lint:all` | Lint tất cả projects |
| `yarn graph` | Xem dependency graph |

### 🏗️ Generators

| Script | Mô tả |
|--------|-------|
| `yarn gen:lib <name>` | Tạo TypeScript library |
| `yarn gen:shared-lib <name>` | Tạo shared library |
| `yarn gen:nest-app <name>` | Tạo NestJS app |

---

## Cấu Trúc Thư Mục

```
nx-project/
├── apps/                          # Applications
│   ├── gateway/                   # NestJS API Gateway
│   ├── file-engine/               # Golang File Processing
│   └── clients/
│       ├── portal/                # Next.js Portal (SEO)
│       └── admin/                 # React Admin Dashboard
│
├── libs/                          # Shared Libraries
│   ├── ts/                        # TypeScript libs (NestJS)
│   │   ├── config/                # Configuration module
│   │   ├── guard/                 # Auth guards
│   │   ├── interceptor/           # HTTP interceptors
│   │   ├── cache/                 # Cache service
│   │   ├── queue/                 # Queue service
│   │   └── ...
│   ├── shared/ts/                 # Shared across frontend/backend
│   │   └── logger/                # Winston logger
│   ├── frontend/                  # Frontend libs (React)
│   │   ├── ui/                    # Shared UI components
│   │   └── hook/                  # Shared hooks
│   └── golang/                    # Golang libs
│       ├── common/                # Logger, config, errors
│       ├── minio-client/          # MinIO wrapper
│       └── image-processor/       # Image manipulation
│
├── .docker/                       # Docker configuration
│   ├── docker-compose.yaml        # Service definitions
│   ├── .env.example               # Environment template
│   └── INFRASTRUCTURE.md          # Infrastructure docs
│
├── go.work                        # Go workspace
├── package.json                   # Node scripts & deps
├── nx.json                        # Nx configuration
└── tsconfig.base.json             # TypeScript base config
```

---

## Tài Liệu Chi Tiết

| Tài liệu | Mô tả |
|----------|-------|
| [📦 INFRASTRUCTURE.md](.docker/INFRASTRUCTURE.md) | Chi tiết về Docker services, databases, networking |
| [📚 MONOREPO_OVERVIEW.md](MONOREPO_OVERVIEW.md) | Tổng quan về cấu trúc monorepo |
| [🚀 QUICK_START.md](QUICK_START.md) | Hướng dẫn bắt đầu nhanh |
| [📖 libs/ts/NEW_LIBRARIES.md](libs/ts/NEW_LIBRARIES.md) | Danh sách và cách sử dụng TypeScript libs |

---

## Environment Variables

Tất cả biến môi trường được quản lý trong `.docker/.env`. Xem file `.docker/.env.example` để biết đầy đủ các biến:

| Category | Variables |
|----------|-----------|
| **Storage** | `DATA_PATH` |
| **PostgreSQL** | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| **Redis** | `REDIS_PASSWORD` |
| **MongoDB** | `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD` |
| **MinIO** | `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` |

---

## Contributing

1. Tạo branch từ `main`: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m 'feat: add some feature'`
3. Push branch: `git push origin feature/my-feature`
4. Tạo Pull Request

### Commit Convention

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.
