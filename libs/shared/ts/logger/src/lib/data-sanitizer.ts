/* eslint-disable @typescript-eslint/no-inferrable-types */
import type { MaskingPolicy, MaskingRule } from './masking-policy.ts';
import { defaultMaskingPolicy, SENSITIVE_FIELD_NAMES } from './masking-policy.ts';

/**
 * Enhanced Data Sanitizer với DFS Algorithm
 * 
 * Features:
 * - Deep traversal với DFS
 * - Circular reference detection
 * - Map/Set/WeakMap/WeakSet support
 * - Class instance handling
 * - Performance optimized
 * - GDPR compliant
 * 
 * Algorithm: Depth-First Search (DFS) with visited tracking
 * Time Complexity: O(n) where n is total nodes
 * Space Complexity: O(d) where d is max depth
 */
export class DataSanitizer {
  private policy: MaskingPolicy;
  private maxDepth: number = 50; // Prevent infinite recursion

  constructor(policy?: MaskingPolicy) {
    this.policy = policy || defaultMaskingPolicy;
  }

  /**
   * Update masking policy
   */
  setPolicy(policy: MaskingPolicy): void {
    this.policy = policy;
  }

  /**
   * Get current policy
   */
  getPolicy(): MaskingPolicy {
    return this.policy;
  }

  /**
   * Set max depth for traversal
   */
  setMaxDepth(depth: number): void {
    this.maxDepth = depth;
  }

  /**
   * Sanitize any data type with DFS
   * Uses WeakMap để track circular references
   */
  sanitize(data: any): any {
    // Skip sanitization in development mode or if disabled
    if (!this.policy.enabled || this.policy.mode === 'development') {
      return data;
    }

    // Initialize visited tracker (WeakMap không count primitive values)
    const visited = new WeakMap<object, any>();

    return this.sanitizeDFS(data, visited, 0);
  }

  /**
   * DFS Algorithm với circular reference detection
   * 
   * @param data - Data to sanitize
   * @param visited - WeakMap tracking visited objects (prevents circular refs)
   * @param depth - Current depth (prevents stack overflow)
   */
  private sanitizeDFS(data: any, visited: WeakMap<object, any>, depth: number): any {
    // Base cases
    if (data === null || data === undefined) {
      return data;
    }

    // Max depth protection
    if (depth > this.maxDepth) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    // Handle primitives
    if (typeof data !== 'object' && typeof data !== 'function') {
      if (typeof data === 'string') {
        return this.sanitizeString(data);
      }
      return data;
    }

    // Circular reference detection
    if (visited.has(data)) {
      return '[CIRCULAR]';
    }

    // Handle functions
    if (typeof data === 'function') {
      return '[Function]';
    }

    // Handle special objects first (before marking as visited)

    // Date
    if (data instanceof Date) {
      return data;
    }

    // RegExp
    if (data instanceof RegExp) {
      return data;
    }

    // Error
    if (data instanceof Error) {
      return {
        name: data.name,
        message: this.sanitizeString(data.message),
        stack: data.stack ? this.sanitizeString(data.stack) : undefined,
      };
    }

    // Buffer/TypedArray
    if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer) {
      return '[Binary Data]';
    }

    // Mark as visited BEFORE traversing children
    visited.set(data, true);

    try {
      // Handle Array
      if (Array.isArray(data)) {
        return this.sanitizeArray(data, visited, depth);
      }

      // Handle Map
      if (data instanceof Map) {
        return this.sanitizeMap(data, visited, depth);
      }

      // Handle Set
      if (data instanceof Set) {
        return this.sanitizeSet(data, visited, depth);
      }

      // Handle WeakMap/WeakSet (cannot iterate)
      if (data instanceof WeakMap || data instanceof WeakSet) {
        return `[${data.constructor.name}]`;
      }

      // Handle Promise
      if (data instanceof Promise) {
        return '[Promise]';
      }

      // Handle plain objects and class instances
      return this.sanitizeObject(data, visited, depth);

    } finally {
      // Optional: Remove from visited after processing
      // visited.delete(data);
      // Keep it to handle re-references correctly
    }
  }

  /**
   * Sanitize Array với DFS
   */
  private sanitizeArray(arr: any[], visited: WeakMap<object, any>, depth: number): any[] {
    const sanitized: any[] = [];

    for (let i = 0; i < arr.length; i++) {
      sanitized[i] = this.sanitizeDFS(arr[i], visited, depth + 1);
    }

    return sanitized;
  }

  /**
   * Sanitize Map với DFS
   */
  private sanitizeMap(map: Map<any, any>, visited: WeakMap<object, any>, depth: number): Map<any, any> {
    const sanitized = new Map();

    for (const [key, value] of map.entries()) {
      const sanitizedKey = this.sanitizeDFS(key, visited, depth + 1);
      const sanitizedValue = this.sanitizeDFS(value, visited, depth + 1);
      sanitized.set(sanitizedKey, sanitizedValue);
    }

    return sanitized;
  }

  /**
   * Sanitize Set với DFS
   */
  private sanitizeSet(set: Set<any>, visited: WeakMap<object, any>, depth: number): Set<any> {
    const sanitized = new Set();

    for (const value of set.values()) {
      sanitized.add(this.sanitizeDFS(value, visited, depth + 1));
    }

    return sanitized;
  }

  /**
   * Sanitize Object với DFS
   * Handles both plain objects and class instances
   */
  private sanitizeObject(obj: any, visited: WeakMap<object, any>, depth: number): any {
    const sanitized: any = {};

    // Get all enumerable properties (including inherited for class instances)
    const keys = Object.keys(obj);

    for (const key of keys) {
      try {
        const value = obj[key];

        // Check if field name is sensitive
        if (this.isSensitiveField(key)) {
          sanitized[key] = this.maskValue(value);
        } else {
          // Recursive DFS for nested values
          sanitized[key] = this.sanitizeDFS(value, visited, depth + 1);
        }
      } catch (error) {
        // Property access might throw (getters, etc.)
        sanitized[key] = '[Error accessing property]';
      }
    }

    // Preserve constructor name for class instances
    if (obj.constructor && obj.constructor.name && obj.constructor.name !== 'Object') {
      sanitized.__type = obj.constructor.name;
    }

    return sanitized;
  }

  /**
   * Sanitize string using regex patterns
   */
  private sanitizeString(value: string): string {
    let sanitized = value;

    // Apply all enabled rules
    const allRules = [
      ...this.policy.rules,
      ...(this.policy.customRules || []),
    ].filter(rule => rule.enabled);

    for (const rule of allRules) {
      if (rule.pattern instanceof RegExp) {
        sanitized = sanitized.replace(rule.pattern, rule.replacement);
      } else {
        // String pattern (case-insensitive substring match)
        const regex = new RegExp(rule.pattern, 'gi');
        sanitized = sanitized.replace(regex, rule.replacement);
      }
    }

    return sanitized;
  }

  /**
   * Check if field name is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return SENSITIVE_FIELD_NAMES.some(sensitive =>
      lowerFieldName.includes(sensitive.toLowerCase())
    );
  }

  /**
   * Mask entire value for sensitive fields
   */
  private maskValue(value: any): string {
    if (value === null || value === undefined) {
      return '***';
    }

    if (typeof value === 'string') {
      // Keep first and last char for readability, mask middle
      if (value.length <= 3) {
        return '***';
      }
      return value[0] + '***' + value[value.length - 1];
    }

    if (typeof value === 'number') {
      return '***';
    }

    if (typeof value === 'boolean') {
      return '***';
    }

    return '***[MASKED]***';
  }

  /**
   * Sanitize specific data types
   */
  sanitizeEmail(email: string): string {
    if (!this.policy.enabled || this.policy.mode === 'development') {
      return email;
    }

    const [local, domain] = email.split('@');
    if (!domain) return '***@***.***';

    const [domainName, tld] = domain.split('.');
    const maskedLocal = local.length > 2 ? local[0] + '***' + local[local.length - 1] : '***';
    const maskedDomain = domainName.length > 2 ? domainName[0] + '***' : '***';

    return `${maskedLocal}@${maskedDomain}.${tld || '***'}`;
  }

  sanitizePhone(phone: string): string {
    if (!this.policy.enabled || this.policy.mode === 'development') {
      return phone;
    }

    // Keep last 4 digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***-***';

    const lastFour = digits.slice(-4);
    return `***-***-${lastFour}`;
  }

  sanitizeCreditCard(cardNumber: string): string {
    if (!this.policy.enabled || this.policy.mode === 'development') {
      return cardNumber;
    }

    // Keep last 4 digits
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 4) return '****';

    const lastFour = digits.slice(-4);
    return `****-****-****-${lastFour}`;
  }

  /**
   * Add custom masking rule
   */
  addCustomRule(rule: MaskingRule): void {
    if (!this.policy.customRules) {
      this.policy.customRules = [];
    }
    this.policy.customRules.push(rule);
  }

  /**
   * Remove custom rule by name
   */
  removeCustomRule(ruleName: string): void {
    if (this.policy.customRules) {
      this.policy.customRules = this.policy.customRules.filter(
        rule => rule.name !== ruleName
      );
    }
  }

  /**
   * Enable/disable specific rule
   */
  toggleRule(ruleName: string, enabled: boolean): void {
    const rule = this.policy.rules.find(r => r.name === ruleName);
    if (rule) {
      rule.enabled = enabled;
    }

    if (this.policy.customRules) {
      const customRule = this.policy.customRules.find(r => r.name === ruleName);
      if (customRule) {
        customRule.enabled = enabled;
      }
    }
  }

  /**
   * Check if data contains PII (for strict mode)
   * Uses DFS to traverse all nodes
   */
  /**
   * Check if data contains PII (for strict mode)
   * Uses DFS to traverse all nodes
   */
  containsPII(data: any): boolean {
    const visited = new WeakSet<object>();
    return this.containsPIIDFS(data, visited, 0);
  }

  private containsPIIDFS(data: any, visited: WeakSet<object>, depth: number): boolean {
    // Base cases
    if (data === null || data === undefined) {
      return false;
    }

    if (typeof data === 'string') {
      return this.containsPIIInString(data);
    }

    if (typeof data !== 'object') {
      return false;
    }

    // Max depth protection
    if (depth > this.maxDepth) {
      return false;
    }

    // Circular reference check
    if (visited.has(data)) {
      return false;
    }
    visited.add(data);

    // Check arrays
    if (Array.isArray(data)) {
      for (const item of data) {
        if (this.containsPIIDFS(item, visited, depth + 1)) {
          return true;
        }
      }
      return false;
    }

    // Check Map
    if (data instanceof Map) {
      for (const [key, value] of data.entries()) {
        if (this.containsPIIDFS(key, visited, depth + 1) || this.containsPIIDFS(value, visited, depth + 1)) {
          return true;
        }
      }
      return false;
    }

    // Check Set
    if (data instanceof Set) {
      for (const value of data.values()) {
        if (this.containsPIIDFS(value, visited, depth + 1)) {
          return true;
        }
      }
      return false;
    }

    // Check plain objects
    for (const [key, value] of Object.entries(data)) {
      // Check field name
      if (this.isSensitiveField(key)) {
        return true;
      }

      // Recursively check value
      if (this.containsPIIDFS(value, visited, depth + 1)) {
        return true;
      }
    }

    return false;
  }

  private containsPIIInString(value: string): boolean {
    const allRules = [
      ...this.policy.rules,
      ...(this.policy.customRules || []),
    ].filter(rule => rule.enabled);

    for (const rule of allRules) {
      if (rule.pattern instanceof RegExp) {
        if (rule.pattern.test(value)) {
          return true;
        }
      }
    }

    return false;
  }
}

/**
 * Default sanitizer instance
 */
export const defaultSanitizer = new DataSanitizer();

/**
 * Helper function to sanitize data
 */
export function sanitize(data: any, policy?: MaskingPolicy): any {
  const sanitizer = policy ? new DataSanitizer(policy) : defaultSanitizer;
  return sanitizer.sanitize(data);
}
