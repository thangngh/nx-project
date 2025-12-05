# 🔒 Data Masking & PII Protection

## 🎯 Overview

System tự động **mask sensitive data** trước khi log để:
- ✅ Bảo vệ thông tin cá nhân (PII)
- ✅ GDPR compliant
- ✅ Tránh data leak
- ✅ Security compliance

**2 Modes:**
- **Development**: Không mask (debug dễ dàng)
- **Production**: Auto mask tất cả PII

---

## 🔐 Sensitive Data Types được Mask

| Type | Pattern | Example (Before) | Example (After) |
|------|---------|------------------|-----------------|
| **Email** | Regex | `user@example.com` | `u***r@e***.com` |
| **Phone** | Regex | `+1-555-123-4567` | `***-***-4567` |
| **Credit Card** | Regex | `4532-1234-5678-9010` | `****-****-****-9010` |
| **SSN** | Regex | `123-45-6789` | `***-**-****` |
| **Password** | Field name | `mypassword123` | `********` |
| **API Key** | 32+ chars | `sk_live_abcdef123456...` | `********************************` |
| **JWT Token** | Regex | `eyJhbGc...` | `eyJ***.eyJ***.***` |
| **National ID** | 9-12 digits | `123456789012` | `***********` |
| **Bank Account** | 10-20 digits | `1234567890` | `**********` |

---

## 🚀 Quick Start

### Auto Masking (Recommended)

```typescript
// app.module.ts
import { ExtendedLoggerModule } from '@nx-project/logger';

@Module({
  imports: [ExtendedLoggerModule],
})
export class AppModule {}
```

```typescript
// any.service.ts
import { ExtendedLoggerService } from '@nx-project/logger';

@Injectable()
export class UserService {
  constructor(private logger: ExtendedLoggerService) {
    this.logger.setContext(UserService.name);
  }

  async login(email: string, password: string) {
    // Automatically masked in production!
    this.logger.auth({
      event: 'login',
      email,        // ← Will be masked: u***r@e***.com
      success: true,
    });
  }
}
```

**Development Output:**
```json
{
  "level": "info",
  "message": "[AUTH 🔐] LOGIN - user@example.com - SUCCESS",
  "email": "user@example.com"  // ← Full email shown
}
```

**Production Output:**
```json
{
  "level": "info",
  "message": "[AUTH 🔐] LOGIN - u***r@e***.com - SUCCESS",
  "email": "u***r@e***.com"  // ← Masked!
}
```

---

## 📋 Default Masking Rules

### Email Masking
```typescript
// Input
const log = { email: 'john.doe@company.com' };

// Development
logger.log('User created', log);
// → email: 'john.doe@company.com'

// Production
logger.log('User created', log);
// → email: 'j***e@c***.com'
```

### Phone Masking
```typescript
// Input
const log = { phone: '+1-555-123-4567' };

// Production Output
logger.log('Phone verified', log);
// → phone: '***-***-4567'
```

### Credit Card Masking
```typescript
// Input
const log = { cardNumber: '4532-1234-5678-9010' };

// Production Output
logger.payment({
  operation: 'charge',
  cardNumber: '4532-1234-5678-9010',
  // ...
});
// → cardNumber: '****-****-****-9010'
```

### Password & Secrets
```typescript
// Input
const log = {
  email: 'user@example.com',
  password: 'SuperSecret123!',
  apiKey: 'sk_live_abcdefghijklmnop1234567890',
};

// Production Output
logger.log('User data', log);
// → {
//   email: 'u***r@e***.com',
//   password: 'S***!',        // Field name detected!
//   apiKey: 'S***0'            // Field name detected!
// }
```

---

## ⚙️ Custom Configuration

### Override Masking Policy

```typescript
import { ExtendedLoggerService, createMaskingPolicy } from '@nx-project/logger';

@Injectable()
export class MyService {
  constructor(private logger: ExtendedLoggerService) {
    // Create custom policy
    const customPolicy = createMaskingPolicy('production');
    
    // Customize rules
    customPolicy.strictMode = true;  // Throw error if PII detected
    
    // Apply policy
    this.logger.setMaskingPolicy(customPolicy);
  }
}
```

### Add Custom Rules

```typescript
import { ExtendedLoggerService } from '@nx-project/logger';

@Injectable()
export class MyService {
  constructor(private logger: ExtendedLoggerService) {
    const policy = this.logger.getMaskingPolicy();
    
    // Add custom rule for Vietnamese phone numbers
    policy.customRules = [{
      name: 'vietnamesePhone',
      pattern: /(\+84|0)[0-9]{9,10}/g,
      replacement: '+84-***-***-***',
      enabled: true,
      description: 'Mask Vietnamese phone numbers',
    }];
    
    this.logger.setMaskingPolicy(policy);
  }
}
```

### Disable Specific Rules

```typescript
const policy = logger.getMaskingPolicy();

// Disable IP address masking (sometimes needed)
const ipRule = policy.rules.find(r => r.name === 'ipAddress');
if (ipRule) {
  ipRule.enabled = false;
}

logger.setMaskingPolicy(policy);
```

---

## 🏗️ Field Name-Based Masking

Sensitive field names are automatically detected:

```typescript
const userData = {
  name: 'John Doe',           // ✅ Not masked
  email: 'john@example.com',  // ⚠️ Masked by regex
  password: 'secret123',      // 🚨 Masked by field name
  apiKey: 'sk_live_xyz',      // 🚨 Masked by field name
  credit_card: '4532...',     // 🚨 Masked by field name
  ssn: '123-45-6789',         // 🚨 Masked by regex
};

logger.log('User data', userData);
```

**Production Output:**
```json
{
  "name": "John Doe",
  "email": "j***n@e***.com",
  "password": "s***3",
  "apiKey": "s***z",
  "credit_card": "****",
  "ssn": "***-**-****"
}
```

**Sensitive field names detected:**
- `password`, `passwd`, `pwd`
- `secret`, `token`, `apiKey`, `api_key`
- `accessToken`, `refreshToken`
- `privateKey`, `private_key`
- `creditCard`, `cardNumber`, `cvv`, `cvc`
- `ssn`, `nationalId`, `passport`
- `bankAccount`, `accountNumber`
- `pin`, `otp`, `verificationCode`
- And more... (see `SENSITIVE_FIELD_NAMES`)

---

## 🔬 Deep Object Traversal

Masking works recursively on nested objects:

```typescript
const complexData = {
  user: {
    profile: {
      email: 'user@example.com',
      contacts: {
        phone: '+1-555-123-4567',
        emergency: {
          name: 'Jane Doe',
          phone: '+1-555-987-6543',
        },
      },
    },
    auth: {
      password: 'secret',
      apiKey: 'sk_live_12345...',
    },
  },
};

logger.log('Complex data', complexData);
```

**Production Output:**
```json
{
  "user": {
    "profile": {
      "email": "u***r@e***.com",
      "contacts": {
        "phone": "***-***-4567",
        "emergency": {
          "name": "Jane Doe",
          "phone": "***-***-6543"
        }
      }
    },
    "auth": {
      "password": "s***t",
      "apiKey": "s***..."
    }
  }
}
```

---

## 🎛️ Environment Modes

### Development Mode (NODE_ENV=development)
- ✅ **No masking** - See full data for debugging
- ✅ Logs include all sensitive info
- ✅ Easy troubleshooting

```bash
NODE_ENV=development npm run dev
```

```json
{
  "email": "user@example.com",     // Full email
  "password": "mypassword123",     // Full password
  "creditCard": "4532-1234-5678-9010"  // Full card number
}
```

### Production Mode (NODE_ENV=production)
- 🔒 **Auto masking** - All PII protected
- 🔒 GDPR compliant
- 🔒 Security first

```bash
NODE_ENV=production npm start
```

```json
{
  "email": "u***r@e***.com",       // Masked
  "password": "m***3",              // Masked
  "creditCard": "****-****-****-9010"  // Masked
}
```

---

## ⚠️ Strict Mode (Optional)

Enable strict mode to **throw errors** when PII is detected in production:

```typescript
const policy = logger.getMaskingPolicy();
policy.strictMode = true;
logger.setMaskingPolicy(policy);

// Will throw error in production if PII detected
logger.log('User email', { email: 'user@example.com' });
// ❌ Error: PII detected in production logs!
```

**Use strict mode when:**
- You want to enforce "no PII in logs" policy
- You're building high-security applications
- Compliance requires zero PII in logs

---

## 🧪 Testing Masking

### Unit Test Example

```typescript
import { DataSanitizer, createMaskingPolicy } from '@nx-project/logger';

describe('Data Masking', () => {
  let sanitizer: DataSanitizer;

  beforeEach(() => {
    const policy = createMaskingPolicy('production');
    sanitizer = new DataSanitizer(policy);
  });

  it('should mask email addresses', () => {
    const data = { email: 'user@example.com' };
    const sanitized = sanitizer.sanitize(data);
    
    expect(sanitized.email).not.toBe('user@example.com');
    expect(sanitized.email).toContain('***');
  });

  it('should mask credit cards', () => {
    const data = { card: '4532-1234-5678-9010' };
    const sanitized = sanitizer.sanitize(data);
    
    expect(sanitized.card).toBe('****-****-****-9010');
  });

  it('should not mask in development', () => {
    const devPolicy = createMaskingPolicy('development');
    const devSanitizer = new DataSanitizer(devPolicy);
    
    const data = { email: 'user@example.com' };
    const sanitized = devSanitizer.sanitize(data);
    
    expect(sanitized.email).toBe('user@example.com');
  });
});
```

---

## 📊 Real-World Examples

### Example 1: User Registration

```typescript
@Injectable()
export class AuthService {
  constructor(private logger: ExtendedLoggerService) {
    this.logger.setContext(AuthService.name);
  }

  async register(dto: RegisterDto) {
    // Development: Full data for debugging
    // Production: Masked automatically
    this.logger.auth({
      event: 'register',
      email: dto.email,           // Masked in prod
      success: true,
      ip: dto.ip,                 // Optional: can disable IP masking
    });

    // Create user...
  }
}
```

### Example 2: Payment Processing

```typescript
@Injectable()
export class PaymentService {
  constructor(private logger: ExtendedLoggerService) {
    this.logger.setContext(PaymentService.name);
  }

  async processPayment(dto: PaymentDto) {
    this.logger.payment({
      transactionId: dto.transactionId,
      operation: 'charge',
      amount: dto.amount,
      currency: dto.currency,
      paymentMethod: 'card',
      status: 'success',
      // Card number will be masked automatically
    });
  }
}
```

### Example 3: Error Logging with Stack Traces

```typescript
try {
  await this.processUserData(userData);
} catch (error) {
  // Stack traces are also sanitized!
  this.logger.exception({
    exceptionType: error.constructor.name,
    message: error.message,  // Will mask any PII in message
    stack: error.stack,      // Will mask any PII in stack trace
    metadata: {
      userData,  // Will mask email, phone, etc.
    },
  });
}
```

---

## ✅ Best Practices

### 1. Always Use in Production
```typescript
// ✅ GOOD
const policy = createMaskingPolicy(process.env.NODE_ENV);
logger.setMaskingPolicy(policy);

// ❌ BAD
const policy = createMaskingPolicy('development'); // Always dev mode!
```

### 2. Verify Masking Rules
```typescript
// Test your custom rules
const testData = { vietnamesePhone: '0123456789' };
const sanitized = sanitizer.sanitize(testData);
console.log(sanitized);  // Verify it's masked
```

### 3. Document Custom Rules
```typescript
// Add description for team
policy.customRules.push({
  name: 'internalEmployeeId',
  pattern: /EMP\d{6}/g,
  replacement: 'EMP****** ',
  enabled: true,
  description: 'Mask employee IDs (format: EMP123456)',
});
```

### 4. Review Logs Regularly
- Check production logs for any PII leaks
- Update masking rules as needed
- Train team on PII protection

---

## 🚨 Common Pitfalls

### ❌ Logging Raw Request Body
```typescript
// BAD - May contain passwords, credit cards
logger.log('Request received', req.body);

// GOOD - Sanitizer will mask sensitive fields
logger.httpRequest({
  method: req.method,
  url: req.url,
  body: req.body,  // Automatically sanitized
});
```

### ❌ Logging Full User Objects
```typescript
// BAD
logger.log('User found', user);

// GOOD - Only log necessary fields
logger.log('User found', {
  userId: user.id,
  // Don't include email, phone, etc.
});
```

### ❌ Disabling Masking in Production
```typescript
// NEVER DO THIS IN PRODUCTION!
const policy = createMaskingPolicy('development');
logger.setMaskingPolicy(policy);
```

---

## 📝 Summary

**Features:**
- ✅ Auto-mask 10+ types of sensitive data
- ✅ Regex-based pattern matching
- ✅ Field name-based detection
- ✅ Deep object traversal
- ✅ Development vs Production modes
- ✅ Custom rules support
- ✅ GDPR compliant
- ✅ Zero configuration needed

**Supported Data:**
- ✅ Email, Phone, Credit Cards
- ✅ SSN, National IDs, Passports
- ✅ Passwords, API Keys, Tokens
- ✅ Bank Accounts, IP Addresses
- ✅ And more...

**Modes:**
- 🔓 Development: Full data (for debugging)
- 🔒 Production: Auto-masked (for security)

---

**Protect your users' data! 🔒🛡️**
