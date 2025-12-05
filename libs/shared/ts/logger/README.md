# @nx-project/shared/logger

Enterprise-grade logging library cho NestJS & NextJS applications.

## 📦 Features

### ✅ **Multiple Logger Implementations:**
1. **JSON Logger** - Loki/Grafana compatible
2. **Winston Logger** - File rotation, multiple transports
3. **Extended Logger** - 13+ specialized logging methods
4. **Security Logger** - IP tracking & threat detection

### ✅ **Specialized Logging:**
- Step tracking (multi-step processes)
- HTTP Request/Response
- Retry logic
- Exception handling
- Webhooks (incoming/outgoing)
- WebSockets
- Database operations
- Cache operations
- Queue/Job processing
- External API calls
- Authentication
- File operations
- Payments

### ✅ **Data Protection (GDPR):**
- Auto-mask sensitive data (PII)
- Email, phone, credit cards
- Passwords, API keys, tokens
- SSN, national IDs
- Development vs Production modes

### ✅ **Security Monitoring:**
- IP tracking & analysis
- Brute force detection
- Rate limiting
- Suspicious IP scoring
- Auto-blocking malicious IPs
- Security alerts

---

## 🚀 Quick Start

### NestJS Server

```typescript
// app.module.ts
import { SecurityLoggerModule } from '@nx-project/shared/logger';

@Module({
  imports: [SecurityLoggerModule],
})
export class AppModule {}

// auth.service.ts
import { SecurityLoggerService } from '@nx-project/shared/logger';

@Injectable()
export class AuthService {
  constructor(private readonly logger: SecurityLoggerService) {
    this.logger.setContext(AuthService.name);
  }

  async login(email: string, password: string, req: Request) {
    const alerts = this.logger.logAuthAttempt({
      event: 'login',
      ip: req.ip,
      email,
      success: true,
    });
  }
}
```

### NextJS Client

```typescript
import { createNextJSLogger } from '@nx-project/shared/logger';

const logger = createNextJSLogger('HomePage');
logger.pageView('/');
logger.userAction('button_click');
```

---

## 📚 Documentation

- **WINSTON_EXAMPLES.md** - Winston logger examples
- **EXTENDED_LOGGER_EXAMPLES.md** - 13 specialized methods
- **DATA_MASKING_GUIDE.md** - PII protection & GDPR
- **SECURITY_MONITORING_GUIDE.md** - IP tracking & threat detection

---

## 🔒 Data Masking (Production)

```typescript
// Development: Full data
{ email: 'user@example.com', ip: '192.168.1.100' }

// Production: Masked PII, but NOT IP (for security)
{ email: 'u***r@e***.com', ip: '192.168.1.100' }
```

---

## 🛡️ Security Features

- ✅ Brute force detection (5+ failed login → alert, 10+ → block)
- ✅ Rate limiting (100 req/min)
- ✅ Suspicious IP scoring (0-100)
- ✅ Auto-block malicious IPs
- ✅ New IP alerts for users
- ✅ IP whitelist/blocklist management

---

## 🎯 Migration from `libs/ts/logger`

**Old import:**
```typescript
import { ExtendedLoggerService } from '@nx-project/logger';
```

**New import:**
```typescript
import { ExtendedLoggerService } from '@nx-project/shared/logger';
```

All functionality remains the same!

---

## 📦 Installation

Winston dependencies:
```bash
npm install winston winston-daily-rotate-file
npm install -D @types/winston
```

---

**Enterprise-ready logging for production! 🚀📝🔒**
