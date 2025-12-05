/**
 * Data Masking Policy Configuration
 * Protects sensitive data from being logged in production
 * 
 * GDPR & Compliance ready
 */

export interface MaskingRule {
  name: string;
  pattern: RegExp | string;
  replacement: string;
  enabled: boolean;
  description?: string;
}

export interface MaskingPolicy {
  mode: 'development' | 'production';
  enabled: boolean;
  strictMode: boolean; // If true, throws error when PII detected in prod
  rules: MaskingRule[];
  customRules?: MaskingRule[];
}

/**
 * Default masking rules for common sensitive data
 */
export const DEFAULT_MASKING_RULES: MaskingRule[] = [
  // Email addresses
  {
    name: 'email',
    pattern: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
    replacement: '***@***.***',
    enabled: true,
    description: 'Mask email addresses',
  },

  // Phone numbers (various formats)
  {
    name: 'phone',
    pattern: /(\+?[\d\s()-]{10,})/g,
    replacement: '***-***-****',
    enabled: true,
    description: 'Mask phone numbers',
  },

  // Credit card numbers
  {
    name: 'creditCard',
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: '****-****-****-****',
    enabled: true,
    description: 'Mask credit card numbers',
  },

  // SSN (Social Security Number) - US format
  {
    name: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '***-**-****',
    enabled: true,
    description: 'Mask SSN',
  },

  // Passwords (common field names)
  {
    name: 'password',
    pattern: 'password',
    replacement: '********',
    enabled: true,
    description: 'Mask password fields',
  },

  // API Keys
  {
    name: 'apiKey',
    pattern: /[a-zA-Z0-9_-]{32,}/g,
    replacement: '********************************',
    enabled: true,
    description: 'Mask API keys (32+ chars)',
  },

  // JWT Tokens
  {
    name: 'jwt',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    replacement: 'eyJ***.eyJ***.***',
    enabled: true,
    description: 'Mask JWT tokens',
  },

  // IP Addresses - IMPORTANT FOR SECURITY MONITORING
  // Enabled by default to detect unauthorized access & attacks
  {
    name: 'ipAddress',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: '***.***.***.***',
    enabled: false, // DISABLED by default for security monitoring
    description: 'Mask IP addresses (DISABLE for security monitoring)',
  },

  // National ID (format varies by country - example for Vietnam)
  {
    name: 'nationalId',
    pattern: /\b\d{9,12}\b/g,
    replacement: '***********',
    enabled: true,
    description: 'Mask national ID numbers',
  },

  // Bank account numbers
  {
    name: 'bankAccount',
    pattern: /\b\d{10,20}\b/g,
    replacement: '**********',
    enabled: true,
    description: 'Mask bank account numbers',
  },
];

/**
 * Sensitive field names that should be masked
 */
export const SENSITIVE_FIELD_NAMES = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'privateKey',
  'private_key',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'cvc',
  'ssn',
  'socialSecurity',
  'social_security',
  'nationalId',
  'national_id',
  'passport',
  'drivingLicense',
  'driving_license',
  'bankAccount',
  'bank_account',
  'accountNumber',
  'account_number',
  'routingNumber',
  'routing_number',
  'pin',
  'otp',
  'verificationCode',
  'verification_code',
];

/**
 * Create masking policy based on environment
 */
export function createMaskingPolicy(env: string = process.env.NODE_ENV || 'development'): MaskingPolicy {
  const isProduction = env === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    enabled: isProduction,
    strictMode: false, // Set to true to throw errors in prod
    rules: DEFAULT_MASKING_RULES,
    customRules: [],
  };
}

/**
 * Default masking policy instance
 */
export const defaultMaskingPolicy = createMaskingPolicy();
