# 📚 Documentation Index / Mục Lục Tài Liệu

## 🌐 Language / Ngôn Ngữ

- [🇬🇧 English](#english-documentation)
- [🇻🇳 Tiếng Việt](#tài-liệu-tiếng-việt)

---

## 🇬🇧 English Documentation

### 🚀 Deployment & Operations

**[DEPLOYMENT_GUIDE_EN.md](./DEPLOYMENT_GUIDE_EN.md)**
- System Architecture
- Prerequisites & Installation
- Configuration Guide
- Deployment Methods (Docker, PM2, Kubernetes)
- Monitoring & Health Checks
- Troubleshooting
- Security Best Practices
- Backup & Recovery

### 📝 Development Guidelines

**[NO_ENUMS_POLICY.md](./NO_ENUMS_POLICY.md)**
- Why avoid TypeScript enums
- Use `const objects` with `as const`
- Migration guide
- ESLint rules

### 📦 Libraries

**Logger Library:**
- [EXTENDED_LOGGER_EXAMPLES.md](../libs/shared/ts/logger/EXTENDED_LOGGER_EXAMPLES.md) - 13 specialized logging methods
- [DATA_MASKING_GUIDE.md](../libs/shared/ts/logger/DATA_MASKING_GUIDE.md) - PII protection & GDPR compliance
- [SECURITY_MONITORING_GUIDE.md](../libs/shared/ts/logger/SECURITY_MONITORING_GUIDE.md) - IP tracking & threat detection
- [SANITIZER_ALGORITHM.md](../libs/shared/ts/logger/SANITIZER_ALGORITHM.md) - DFS algorithm for data traversal
- [DESIGN_PATTERNS.md](../libs/shared/ts/logger/DESIGN_PATTERNS.md) - Design patterns analysis
- [IP_TRACKER_MEMORY_ANALYSIS.md](../libs/shared/ts/logger/IP_TRACKER_MEMORY_ANALYSIS.md) - Memory usage & optimization

**Docker & Infrastructure:**
- [README.md](../.docker/README.md) - Docker setup guide
- [LOGGING_RELIABILITY.md](../.docker/LOGGING_RELIABILITY.md) - Logging stack options
- [MONITORING_THRESHOLDS.md](../.docker/MONITORING_THRESHOLDS.md) - Alert thresholds

---

## 🇻🇳 Tài Liệu Tiếng Việt

### 🚀 Triển Khai & Vận Hành

**[DEPLOYMENT_GUIDE_VI.md](./DEPLOYMENT_GUIDE_VI.md)**
- Kiến trúc hệ thống
- Yêu cầu & cài đặt
- Hướng dẫn cấu hình
- Các phương pháp triển khai (Docker, PM2, Kubernetes)
- Giám sát & kiểm tra sức khỏe
- Xử lý sự cố
- Thực hành bảo mật tốt nhất
- Sao lưu & phục hồi

### 📝 Hướng Dẫn Phát Triển

**[NO_ENUMS_POLICY.md](./NO_ENUMS_POLICY.md)** *(English only)*
- Tại sao tránh TypeScript enums
- Sử dụng `const objects` với `as const`
- Hướng dẫn migration
- ESLint rules

### 📦 Thư Viện

**Logger Library:**
- [EXTENDED_LOGGER_EXAMPLES.md](../libs/shared/ts/logger/EXTENDED_LOGGER_EXAMPLES.md) - 13 phương thức logging chuyên biệt *(EN)*
- [DATA_MASKING_GUIDE.md](../libs/shared/ts/logger/DATA_MASKING_GUIDE.md) - Bảo vệ PII & tuân thủ GDPR *(EN)*
- [SECURITY_MONITORING_GUIDE.md](../libs/shared/ts/logger/SECURITY_MONITORING_GUIDE.md) - Theo dõi IP & phát hiện mối đe dọa *(EN)*
- [SANITIZER_ALGORITHM.md](../libs/shared/ts/logger/SANITIZER_ALGORITHM.md) - Thuật toán DFS *(EN)*
- [DESIGN_PATTERNS.md](../libs/shared/ts/logger/DESIGN_PATTERNS.md) - Phân tích design patterns *(EN)*
- [IP_TRACKER_MEMORY_ANALYSIS.md](../libs/shared/ts/logger/IP_TRACKER_MEMORY_ANALYSIS.md) - Phân tích memory & tối ưu *(EN)*

**Docker & Infrastructure:**
- [README.md](../.docker/README.md) - Hướng dẫn Docker *(EN)*
- [LOGGING_RELIABILITY.md](../.docker/LOGGING_RELIABILITY.md) - Tùy chọn logging stack *(EN)*
- [MONITORING_THRESHOLDS.md](../.docker/MONITORING_THRESHOLDS.md) - Ngưỡng cảnh báo *(EN)*

---

## 📋 Quick Links / Liên Kết Nhanh

### For DevOps / Cho DevOps
- [🇬🇧 Deployment Guide EN](./DEPLOYMENT_GUIDE_EN.md)
- [🇻🇳 Hướng Dẫn Triển Khai VI](./DEPLOYMENT_GUIDE_VI.md)
- [Docker Setup](../.docker/README.md)
- [Monitoring](../.docker/MONITORING_THRESHOLDS.md)

### For Developers / Cho Developers
- [Logger Examples](../libs/shared/ts/logger/EXTENDED_LOGGER_EXAMPLES.md)
- [Data Masking](../libs/shared/ts/logger/DATA_MASKING_GUIDE.md)
- [Security Monitoring](../libs/shared/ts/logger/SECURITY_MONITORING_GUIDE.md)
- [Design Patterns](../libs/shared/ts/logger/DESIGN_PATTERNS.md)
- [No Enums Policy](./NO_ENUMS_POLICY.md)

### For Architects / Cho Kiến Trúc Sư
- [Design Patterns Analysis](../libs/shared/ts/logger/DESIGN_PATTERNS.md)
- [System Architecture](./DEPLOYMENT_GUIDE_EN.md#system-architecture)
- [Logging Reliability](../.docker/LOGGING_RELIABILITY.md)
- [Memory Analysis](../libs/shared/ts/logger/IP_TRACKER_MEMORY_ANALYSIS.md)

---

## 📊 Documentation Status / Trạng Thái Tài Liệu

| Document | English | Vietnamese | Status |
|----------|---------|------------|--------|
| Deployment Guide | ✅ | ✅ | Complete |
| Logger Examples | ✅ | ❌ | EN only |
| Data Masking | ✅ | ❌ | EN only |
| Security Monitoring | ✅ | ❌ | EN only |
| Design Patterns | ✅ | ❌ | EN only |
| No Enums Policy | ✅ | ❌ | EN only |
| Docker Setup | ✅ | ❌ | EN only |

**Legend / Chú thích:**
- ✅ Available / Có sẵn
- ❌ Not available / Chưa có
- 🔄 In progress / Đang thực hiện

---

## 🎯 Getting Started / Bắt Đầu

### For New Developers / Cho Developers Mới

1. Read deployment guide / Đọc hướng dẫn triển khai:
   - [🇬🇧 EN](./DEPLOYMENT_GUIDE_EN.md) | [🇻🇳 VI](./DEPLOYMENT_GUIDE_VI.md)

2. Set up development environment / Thiết lập môi trường phát triển:
   ```bash
   # Clone repository
   git clone https://github.com/your-org/nx-project.git
   cd nx-project
   
   # Install dependencies
   npm install
   
   # Set up environment
   cp .env.example .env
   
   # Start development
   npm run dev
   ```

3. Learn about logging / Học về logging:
   - [Logger Examples](../libs/shared/ts/logger/EXTENDED_LOGGER_EXAMPLES.md)

4. Understand security / Hiểu về bảo mật:
   - [Security Monitoring](../libs/shared/ts/logger/SECURITY_MONITORING_GUIDE.md)
   - [Data Masking](../libs/shared/ts/logger/DATA_MASKING_GUIDE.md)

### For DevOps Engineers / Cho Kỹ Sư DevOps

1. Review system architecture / Xem lại kiến trúc hệ thống:
   - [Architecture Diagram](./DEPLOYMENT_GUIDE_EN.md#system-architecture)

2. Set up infrastructure / Thiết lập hạ tầng:
   - [Docker Setup](../.docker/README.md)

3. Configure monitoring / Cấu hình giám sát:
   - [Monitoring Thresholds](../.docker/MONITORING_THRESHOLDS.md)

4. Deploy to production / Triển khai lên production:
   - [🇬🇧 EN Guide](./DEPLOYMENT_GUIDE_EN.md#deployment) | [🇻🇳 VI Guide](./DEPLOYMENT_GUIDE_VI.md#triển-khai)

---

## 📞 Support / Hỗ Trợ

**Documentation Issues / Vấn đề tài liệu:**  
https://github.com/your-org/nx-project/issues

**Email:**  
support@yourdomain.com

---

**Last Updated / Cập nhật lần cuối:** 2025-12-05  
**Version / Phiên bản:** 1.0.0
