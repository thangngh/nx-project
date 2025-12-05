# 🛡️ Security Monitoring & IP Tracking Guide

## 🎯 Problem Statement

**Vấn đề:** Cần balance giữa:
1. ✅ **Privacy** - Mask PII (emails, passwords, credit cards)
2. ✅ **Security** - Track IPs để detect unauthorized access

**Giải pháp:**
- ✅ **Mask PII** trong logs (GDPR compliant)
- ✅ **KHÔNG mask IP addresses** để security monitoring
- ✅ **Auto-detect** suspicious IPs và attacks
- ✅ **Auto-block** malicious IPs

---

## 🚀 Quick Start

### Setup

```typescript
// app.module.ts
import { SecurityLoggerModule } from '@nx-project/logger';

@Module({
  imports: [SecurityLoggerModule],
})
export class AppModule {}
```

### Basic Usage

```typescript
// auth.service.ts
import { SecurityLoggerService } from '@nx-project/logger';

@Injectable()
export class AuthService {
  constructor(private readonly securityLogger: SecurityLoggerService) {
    this.securityLogger.setContext('AuthService');
  }

  async login(email: string, password: string, req: Request) {
    try {
      const user = await this.validateCredentials(email, password);
      
      // ✅ Log successful login with IP tracking
      const alerts = this.securityLogger.logAuthAttempt({
        event: 'login',
        ip: req.ip,
        userId: user.id,
        email,
        success: true,
        userAgent: req.headers['user-agent'],
      });
      
      return this.generateToken(user);
    } catch (error) {
      // ⚠️ Log failed login - auto-detect brute force
      const alerts = this.securityLogger.logAuthAttempt({
        event: 'login',
        ip: req.ip,
        email,
        success: false,
        reason: error.message,
        userAgent: req.headers['user-agent'],
      });
      
      // 🚨 Auto-block if too many failures
      if (alerts.some(a => a.shouldBlock)) {
        this.securityLogger.blockIP(req.ip, 'Brute force detected');
      }
      
      throw error;
    }
  }
}
```

---

## 🔍 Features

### 1. **IP Tracking**

Mỗi request được track với:
```typescript
{
  ip: '192.168.1.100',
  timestamp: Date,
  endpoint: '/api/login',
  method: 'POST',
  statusCode: 401,
  userId: 'user-123',
  userAgent: 'Mozilla/5.0...',
  success: false,
  reason: 'Invalid password'
}
```

### 2. **Brute Force Detection**

```typescript
// Auto-detected khi:
// - 5+ failed attempts trong 5 phút
// - 10+ failed attempts → Auto-block

// Example alert:
{
  type: 'bruteForce',
  severity: 'high',
  ip: '192.168.1.100',
  description: 'Brute force detected: 8 failed attempts from 192.168.1.100',
  shouldBlock: false, // true nếu >= 10 attempts
  metadata: {
    failedAttempts: 8,
    endpoints: ['/api/login', '/api/login', ...]
  }
}
```

**Console Output:**
```
🔴 [SECURITY HIGH] bruteForce: Brute force detected: 8 failed attempts from 192.168.1.100
```

### 3. **Rate Limiting**

```typescript
// Auto-detected khi:
// - 100+ requests trong 1 phút

// Example alert:
{
  type: 'rateLimitExceeded',
  severity: 'medium',
  ip: '192.168.1.100',
  description: 'Rate limit exceeded: 150 requests in 1 minute',
  metadata: {
    requestCount: 150,
    limit: 100
  }
}
```

**Console Output:**
```
🟠 [SECURITY MEDIUM] rateLimitExceeded: Rate limit exceeded: 150 requests in 1 minute from 192.168.1.100
```

### 4. **New IP Detection**

```typescript
// Alert khi user login từ IP mới

{
  type: 'newIPForUser',
  severity: 'low',
  ip: '203.0.113.5',
  userId: 'user-123',
  description: 'User user-123 logging in from new IP 203.0.113.5',
  metadata: {
    previousIPs: ['192.168.1.100', '10.0.0.5']
  }
}
```

**Console Output:**
```
🟡 [SECURITY LOW] newIPForUser: User user-123 logging in from new IP 203.0.113.5
```

### 5. **Suspicious Score**

Mỗi IP được calculate suspicious score (0-100):

```typescript
const score = calculateScore({
  failureRate: 0.6,        // → +30 points
  userAgents: 12,          // → +20 points (bot-like)
  userIds: 8,              // → +25 points (account testing)
  totalRequests: 1500,     // → +15 points (high volume)
  endpoints: 75,           // → +10 points (scanning)
});
// Total: 100 (very suspicious!)
```

**Query suspicious IPs:**
```typescript
// Get IPs with score >= 70
const suspicious = securityLogger.getSuspiciousIPs(70);

console.log(suspicious);
// [
//   { ip: '192.168.1.100', suspiciousScore: 85, totalRequests: 2000, failedRequests: 1200 },
//   { ip: '10.0.0.50', suspiciousScore: 72, totalRequests: 500, failedRequests: 400 }
// ]
```

---

## 📊 IP Management

### Block IP

```typescript
// Manual block
securityLogger.blockIP('192.168.1.100', 'Malicious activity detected');

// Auto-block after 10 failed login attempts
if (failedAttempts >= 10) {
  securityLogger.blockIP(ip, `Brute force: ${failedAttempts} attempts`);
}
```

**Console Output:**
```
[SECURITY] Blocked IP 192.168.1.100: Malicious activity detected
```

### Unblock IP

```typescript
securityLogger.unblockIP('192.168.1.100');
```

**Console Output:**
```
[SECURITY] Unblocked IP 192.168.1.100
```

### Whitelist IP

```typescript
// Whitelist trusted IPs (office, VPN, etc.)
securityLogger.whitelistIP('10.0.0.1');     // Office network
securityLogger.whitelistIP('203.0.113.0');  // VPN gateway
```

**Console Output:**
```
[SECURITY] IP WHITELISTED: 10.0.0.1
```

### Check IP Status

```typescript
// Before processing request
if (securityLogger.isIPBlocked(req.ip)) {
  throw new ForbiddenException('Your IP has been blocked');
}
```

---

## 📈 Statistics & Monitoring

### Get IP Statistics

```typescript
const stats = securityLogger.getIPStatistics('192.168.1.100');

console.log(stats);
// {
//   ip: '192.168.1.100',
//   totalRequests: 150,
//   failedRequests: 45,
//   successRequests: 105,
//   firstSeen: Date('2025-12-05T08:00:00Z'),
//   lastSeen: Date('2025-12-05T09:00:00Z'),
//   endpoints: Set(['/api/login', '/api/users', ...]),
//   userAgents: Set(['Mozilla/5.0...', 'curl/7.68.0']),
//   userIds: Set(['user-123', 'user-456']),
//   suspiciousScore: 35
// }
```

### Get Suspicious IPs

```typescript
// Get IPs with suspicious score >= 70
const suspicious = securityLogger.getSuspiciousIPs(70);

// Auto-review and block
for (const stats of suspicious) {
  if (stats.suspiciousScore >= 90) {
    securityLogger.blockIP(stats.ip, `High suspicious score: ${stats.suspiciousScore}`);
  }
}
```

### Get Security Summary

```typescript
const summary = securityLogger.getSecuritySummary();

console.log(summary);
// {
//   totalIPs: 523,
//   blockedIPs: 12,
//   whitelistedIPs: 3,
//   suspiciousIPs: 38,
//   totalRequests: 15240
// }
```

**Console Output:**
```
[SECURITY] Summary {
  totalIPs: 523,
  blockedIPs: 12,
  whitelistedIPs: 3,
  suspiciousIPs: 38,
  totalRequests: 15240
}
```

---

## 🔧 Configuration

### Thresholds

```typescript
// Default thresholds (in ip-tracker.ts)
const config = {
  FAILED_LOGIN_THRESHOLD: 5,      // 5 failed → warning
  AUTO_BLOCK_THRESHOLD: 10,       // 10 failed → auto-block
  RATE_LIMIT_WINDOW: 60000,       // 1 minute
  RATE_LIMIT_MAX: 100,            // 100 requests/minute
  MAX_LOGS: 10000,                // Keep last 10k logs
};
```

### Custom Thresholds

```typescript
import { globalIPTracker } from '@nx-project/logger';

// Override defaults
globalIPTracker.FAILED_LOGIN_THRESHOLD = 3;  // More strict
globalIPTracker.RATE_LIMIT_MAX = 50;         // Lower limit
```

---

## 🧪 Real-World Examples

### Example 1: Login Endpoint

```typescript
@Post('login')
async login(@Body() dto: LoginDto, @Req() req: Request) {
  // Check if IP is blocked first
  if (this.securityLogger.isIPBlocked(req.ip)) {
    throw new ForbiddenException('IP blocked due to suspicious activity');
  }

  try {
    const user = await this.authService.validateUser(dto.email, dto.password);
    
    // Log successful login
    const alerts = this.securityLogger.logAuthAttempt({
      event: 'login',
      ip: req.ip,
      userId: user.id,
      email: dto.email,
      success: true,
      userAgent: req.headers['user-agent'],
    });
    
    // Check for new IP alert
    const newIPAlert = alerts.find(a => a.type === 'newIPForUser');
    if (newIPAlert) {
      // Send email notification to user
      await this.emailService.sendNewIPAlert(user.email, req.ip);
    }
    
    return this.authService.generateToken(user);
  } catch (error) {
    // Log failed login
    const alerts = this.securityLogger.logAuthAttempt({
      event: 'login',
      ip: req.ip,
      email: dto.email,
      success: false,
      reason: 'Invalid credentials',
      userAgent: req.headers['user-agent'],
    });
    
    // Auto-block if brute force detected
    const bruteForceAlert = alerts.find(a => a.type === 'bruteForce' && a.shouldBlock);
    if (bruteForceAlert) {
      this.securityLogger.blockIP(req.ip, 'Brute force attack');
      await this.slackService.sendAlert({
        channel: '#security',
        message: `🚨 IP ${req.ip} blocked for brute force attack`,
      });
    }
    
    throw new UnauthorizedException('Invalid credentials');
  }
}
```

### Example 2: API Endpoint with Rate Limiting

```typescript
@Get('users')
async getUsers(@Req() req: Request) {
  // Track HTTP request
  const alerts = this.securityLogger.logHTTPRequest({
    ip: req.ip,
    method: req.method,
    url: req.url,
    statusCode: 200,
    userId: req.user?.id,
    userAgent: req.headers['user-agent'],
  });
  
  // Check for rate limit violations
  const rateLimitAlert = alerts.find(a => a.type === 'rateLimitExceeded');
  if (rateLimitAlert) {
    throw new TooManyRequestsException('Rate limit exceeded');
  }
  
  return this.userService.findAll();
}
```

### Example 3: Admin Dashboard - Security Overview

```typescript
@Controller('admin/security')
export class SecurityDashboardController {
  constructor(private readonly securityLogger: SecurityLoggerService) {}

  @Get('summary')
  getSummary() {
    return this.securityLogger.getSecuritySummary();
  }

  @Get('suspicious-ips')
  getSuspicious(@Query('threshold') threshold: number = 70) {
    return this.securityLogger.getSuspiciousIPs(threshold);
  }

  @Get('ip/:ip')
  getIPDetails(@Param('ip') ip: string) {
    return this.securityLogger.getIPStatistics(ip);
  }

  @Post('ip/:ip/block')
  blockIP(@Param('ip') ip: string, @Body() body: { reason: string }) {
    this.securityLogger.blockIP(ip, body.reason);
    return { message: 'IP blocked successfully' };
  }

  @Delete('ip/:ip/block')
  unblockIP(@Param('ip') ip: string) {
    this.securityLogger.unblockIP(ip);
    return { message: 'IP unblocked successfully' };
  }

  @Post('ip/:ip/whitelist')
  whitelistIP(@Param('ip') ip: string) {
    this.securityLogger.whitelistIP(ip);
    return { message: 'IP whitelisted successfully' };
  }
}
```

---

## 📊 Log Output Examples

### Failed Login (Development)
```json
{
  "timestamp": "2025-12-05T09:00:00.123Z",
  "level": "info",
  "message": "[AUTH 🔐] LOGIN - user@example.com - FAILED",
  "metadata": {
    "email": "user@example.com",    // Full email (dev mode)
    "ip": "192.168.1.100",          // ✅ NOT masked
    "reason": "Invalid password",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Failed Login (Production)
```json
{
  "timestamp": "2025-12-05T09:00:00.123Z",
  "level": "info",
  "message": "[AUTH 🔐] LOGIN - u***r@e***.com - FAILED",
  "metadata": {
    "email": "u***r@e***.com",      // ✅ Masked (prod mode)
    "ip": "192.168.1.100",          // ✅ NOT masked (security!)
    "reason": "Invalid password",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Brute Force Alert
```json
{
  "timestamp": "2025-12-05T09:05:00.456Z",
  "level": "error",
  "message": "🔴 [SECURITY HIGH] bruteForce: Brute force detected: 8 failed attempts from 192.168.1.100",
  "metadata": {
    "type": "bruteForce",
    "severity": "high",
    "ip": "192.168.1.100",          // ✅ Full IP for analysis
    "failedAttempts": 8,
    "shouldBlock": false
  }
}
```

---

## ✅ Best Practices

### 1. Always Track IPs for Security
```typescript
// ✅ GOOD - Track IP with auth attempts
securityLogger.logAuthAttempt({
  event: 'login',
  ip: req.ip,              // IMPORTANT!
  email,
  success: true,
});

// ❌ BAD - Missing IP tracking
logger.auth({
  event: 'login',
  email,
  success: true,
});
```

### 2. Handle Security Alerts
```typescript
const alerts = securityLogger.logAuthAttempt({...});

// Check for critical alerts
if (alerts.some(a => a.severity === 'critical')) {
  await this.notifySecurityTeam(alerts);
}

// Auto-block if needed
if (alerts.some(a => a.shouldBlock)) {
  securityLogger.blockIP(req.ip, 'Automated blocking');
}
```

### 3. Whitelist Trusted IPs
```typescript
// Whitelist office IPs, VPNs, monitoring tools
const trustedIPs = [
  '10.0.0.0/8',      // Office network
  '203.0.113.5',     // VPN gateway
  '198.51.100.10',   // Monitoring service
];

for (const ip of trustedIPs) {
  securityLogger.whitelistIP(ip);
}
```

### 4. Regular Security Reviews
```typescript
// Scheduled job (daily)
@Cron('0 0 * * *')
async dailySecurityReview() {
  // Get suspicious IPs
  const suspicious = this.securityLogger.getSuspiciousIPs(70);
  
  // Review and block high-risk IPs
  for (const stats of suspicious) {
    if (stats.suspiciousScore >= 90) {
      this.securityLogger.blockIP(stats.ip, `Auto-block: score ${stats.suspiciousScore}`);
    }
  }
  
  // Send report
  const summary = this.securityLogger.getSecuritySummary();
  await this.emailService.sendSecurityReport(summary);
}
```

---

## 🚨 Alert Severity Levels

| Severity | Description | Action |
|----------|-------------|--------|
| **Low** 🟡 | New IP for user | Log only, maybe notify user |
| **Medium** 🟠 | Rate limit exceeded | Throttle requests |
| **High** 🔴 | Brute force detected (5-9 attempts) | Alert security team |
| **Critical** 🚨 | Brute force (10+ attempts) | Auto-block IP |

---

## 📝 Summary

**Features:**
- ✅ IP tracking for all auth attempts
- ✅ Brute force detection (auto-block after 10 failures)
- ✅ Rate limiting (100 requests/minute)
- ✅ Suspicious IP scoring (0-100)
- ✅ New IP alerts for users
- ✅ IP blocking/unblocking
- ✅ IP whitelisting
- ✅ Security statistics & reports

**Why NOT mask IPs:**
- ✅ Detect unauthorized access
- ✅ Track brute force attacks
- ✅ Identify suspicious patterns
- ✅ Geographic analysis
- ✅ Forensics & investigations

**Privacy vs Security:**
- ✅ **Mask** PII (emails, passwords, cards) → GDPR compliant
- ✅ **DON'T mask** IPs → Security monitoring
- ✅ Best of both worlds!

---

**Protect your system from attacks! 🛡️🚨**
