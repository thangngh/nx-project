/* eslint-disable @typescript-eslint/no-inferrable-types */
import type { MaskingPolicy, MaskingRule } from './masking-policy.ts';
import { defaultMaskingPolicy, SENSITIVE_FIELD_NAMES } from './masking-policy.ts';

/**
 * Context for sanitization strategies
 */
export interface SanitizationContext {
  sanitizer: DataSanitizer;
  visited: WeakMap<object, any>;
  depth: number;
}

/**
 * Strategy interface for handling different data types
 */
export interface SanitizationStrategy {
  canHandle(data: any): boolean;
  sanitize(data: any, context: SanitizationContext): any;
}

// ============================================================================
// STRATEGIES
// ============================================================================

class FunctionStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean { return typeof data === 'function'; }
  sanitize(): any { return '[Function]'; }
}

class DateStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean { return data instanceof Date; }
  sanitize(data: any): any { return data; }
}

class RegExpStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean { return data instanceof RegExp; }
  sanitize(data: any): any { return data; }
}

class ErrorStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean { return data instanceof Error; }
  sanitize(data: Error, ctx: SanitizationContext): any {
    return {
      name: data.name,
      message: ctx.sanitizer.sanitizeString(data.message),
      stack: data.stack ? ctx.sanitizer.sanitizeString(data.stack) : undefined,
    };
  }
}

class BufferStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean {
    return (typeof ArrayBuffer !== 'undefined' && (ArrayBuffer.isView(data) || data instanceof ArrayBuffer));
  }
  sanitize(): any { return '[Binary Data]'; }
}

class PromiseStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean { return data instanceof Promise; }
  sanitize(): any { return '[Promise]'; }
}

class WeakCollectionStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean { return data instanceof WeakMap || data instanceof WeakSet; }
  sanitize(data: any): any { return `[${data.constructor.name}]`; }
}

class ArrayStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean { return Array.isArray(data); }
  sanitize(data: any[], ctx: SanitizationContext): any[] {
    ctx.visited.set(data, true);
    return data.map(item => ctx.sanitizer.sanitizeRecursive(item, ctx.visited, ctx.depth + 1));
  }
}

class MapStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean { return data instanceof Map; }
  sanitize(data: Map<any, any>, ctx: SanitizationContext): Map<any, any> {
    ctx.visited.set(data, true);
    const sanitized = new Map();
    for (const [key, value] of data.entries()) {
      const sanitizedKey = ctx.sanitizer.sanitizeRecursive(key, ctx.visited, ctx.depth + 1);
      const sanitizedValue = ctx.sanitizer.sanitizeRecursive(value, ctx.visited, ctx.depth + 1);
      sanitized.set(sanitizedKey, sanitizedValue);
    }
    return sanitized;
  }
}

class SetStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean { return data instanceof Set; }
  sanitize(data: Set<any>, ctx: SanitizationContext): Set<any> {
    ctx.visited.set(data, true);
    const sanitized = new Set();
    for (const value of data.values()) {
      sanitized.add(ctx.sanitizer.sanitizeRecursive(value, ctx.visited, ctx.depth + 1));
    }
    return sanitized;
  }
}

class ObjectStrategy implements SanitizationStrategy {
  canHandle(data: any): boolean { return typeof data === 'object' && data !== null; }
  sanitize(data: any, ctx: SanitizationContext): any {
    ctx.visited.set(data, true);
    const sanitized: any = {};
    const keys = Object.keys(data);

    for (const key of keys) {
      try {
        const value = data[key];
        if (ctx.sanitizer.isSensitiveField(key)) {
          sanitized[key] = ctx.sanitizer.maskValue(value);
        } else {
          sanitized[key] = ctx.sanitizer.sanitizeRecursive(value, ctx.visited, ctx.depth + 1);
        }
      } catch (error) {
        sanitized[key] = '[Error accessing property]';
      }
    }

    // Preserve constructor name
    if (data.constructor && data.constructor.name && data.constructor.name !== 'Object') {
      sanitized.__type = data.constructor.name;
    }

    return sanitized;
  }
}

// ============================================================================
// MAIN CLASS
// ============================================================================

/**
 * Enhanced Data Sanitizer with Strategy Pattern
 */
export class DataSanitizer {
  private policy: MaskingPolicy;
  private maxDepth: number = 50;

  // Strategy Registry
  private strategies: SanitizationStrategy[] = [
    new FunctionStrategy(),
    new DateStrategy(),
    new RegExpStrategy(),
    new ErrorStrategy(),
    new BufferStrategy(),
    new PromiseStrategy(),
    new WeakCollectionStrategy(),
    new ArrayStrategy(),
    new MapStrategy(),
    new SetStrategy(),
    new ObjectStrategy(), // Fallback for generic objects
  ];

  constructor(policy?: MaskingPolicy) {
    this.policy = policy || defaultMaskingPolicy;
  }

  setPolicy(policy: MaskingPolicy): void {
    this.policy = policy;
  }

  getPolicy(): MaskingPolicy {
    return this.policy;
  }

  setMaxDepth(depth: number): void {
    this.maxDepth = depth;
  }

  /**
   * Main entry point for sanitization
   */
  sanitize(data: any): any {
    if (!this.policy.enabled || this.policy.mode === 'development') {
      return data;
    }
    const visited = new WeakMap<object, any>();
    return this.sanitizeRecursive(data, visited, 0);
  }

  /**
   * Recursive sanitization method used by strategies
   */
  sanitizeRecursive(data: any, visited: WeakMap<object, any>, depth: number): any {
    // 1. Base Checks
    if (data === null || data === undefined) return data;
    if (depth > this.maxDepth) return '[MAX_DEPTH_EXCEEDED]';

    // 2. Primitive Checks
    if (typeof data !== 'object' && typeof data !== 'function') {
      return typeof data === 'string' ? this.sanitizeString(data) : data;
    }

    // 3. Circular Reference Check
    if (visited.has(data)) return '[CIRCULAR]';

    // 4. Strategy Selection
    for (const strategy of this.strategies) {
      if (strategy.canHandle(data)) {
        return strategy.sanitize(data, {
          sanitizer: this,
          visited,
          depth
        });
      }
    }

    return data;
  }

  // --- Helper Methods (Public for Strategies) ---

  sanitizeString(value: string): string {
    let sanitized = value;
    const allRules = [
      ...this.policy.rules,
      ...(this.policy.customRules || []),
    ].filter(rule => rule.enabled);

    for (const rule of allRules) {
      if (rule.pattern instanceof RegExp) {
        sanitized = sanitized.replace(rule.pattern, rule.replacement);
      } else {
        const regex = new RegExp(rule.pattern, 'gi');
        sanitized = sanitized.replace(regex, rule.replacement);
      }
    }
    return sanitized;
  }

  isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return SENSITIVE_FIELD_NAMES.some(sensitive =>
      lowerFieldName.includes(sensitive.toLowerCase())
    );
  }

  maskValue(value: any): string {
    if (value === null || value === undefined) return '***';
    if (typeof value === 'string') {
      if (value.length <= 3) return '***';
      return value[0] + '***' + value[value.length - 1];
    }
    if (typeof value === 'number' || typeof value === 'boolean') return '***';
    return '***[MASKED]***';
  }

  // --- Specific Sanitizers ---

  sanitizeEmail(email: string): string {
    if (!this.policy.enabled || this.policy.mode === 'development') return email;
    const [local, domain] = email.split('@');
    if (!domain) return '***@***.***';
    const [domainName, tld] = domain.split('.');
    const maskedLocal = local.length > 2 ? local[0] + '***' + local[local.length - 1] : '***';
    return `${maskedLocal}@${domainName ? (domainName.length > 2 ? domainName[0] + '***' : '***') : '***'}.${tld || '***'}`;
  }

  sanitizePhone(phone: string): string {
    if (!this.policy.enabled || this.policy.mode === 'development') return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***-***';
    return `***-***-${digits.slice(-4)}`;
  }

  sanitizeCreditCard(cardNumber: string): string {
    if (!this.policy.enabled || this.policy.mode === 'development') return cardNumber;
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 4) return '****';
    return `****-****-****-${digits.slice(-4)}`;
  }

  // --- Rule Management ---

  addCustomRule(rule: MaskingRule): void {
    if (!this.policy.customRules) this.policy.customRules = [];
    this.policy.customRules.push(rule);
  }

  removeCustomRule(ruleName: string): void {
    if (this.policy.customRules) {
      this.policy.customRules = this.policy.customRules.filter(r => r.name !== ruleName);
    }
  }

  toggleRule(ruleName: string, enabled: boolean): void {
    const rule = this.policy.rules.find(r => r.name === ruleName);
    if (rule) rule.enabled = enabled;
    if (this.policy.customRules) {
      const custom = this.policy.customRules.find(r => r.name === ruleName);
      if (custom) custom.enabled = enabled;
    }
  }

  // --- PII Detection (Simplified) ---

  containsPII(data: any): boolean {
    const visited = new WeakSet<object>();
    return this.containsPIIDFS(data, visited, 0);
  }

  private containsPIIDFS(data: any, visited: WeakSet<object>, depth: number): boolean {
    if (data === null || data === undefined) return false;
    if (typeof data === 'string') return this.containsPIIInString(data);
    if (typeof data !== 'object') return false;
    if (depth > this.maxDepth) return false;
    if (visited.has(data)) return false;

    visited.add(data);

    if (Array.isArray(data)) {
      return data.some(item => this.containsPIIDFS(item, visited, depth + 1));
    }

    if (data instanceof Map) {
      for (const [key, value] of data.entries()) {
        if (this.containsPIIDFS(key, visited, depth + 1) || this.containsPIIDFS(value, visited, depth + 1)) return true;
      }
      return false;
    }

    if (data instanceof Set) {
      for (const value of data.values()) {
        if (this.containsPIIDFS(value, visited, depth + 1)) return true;
      }
      return false;
    }

    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) return true;
      if (this.containsPIIDFS(value, visited, depth + 1)) return true;
    }

    return false;
  }

  private containsPIIInString(value: string): boolean {
    const allRules = [...this.policy.rules, ...(this.policy.customRules || [])].filter(r => r.enabled);
    return allRules.some(rule =>
      rule.pattern instanceof RegExp ? rule.pattern.test(value) : false
    );
  }
}

export const defaultSanitizer = new DataSanitizer();

export function sanitize(data: any, policy?: MaskingPolicy): any {
  const sanitizer = policy ? new DataSanitizer(policy) : defaultSanitizer;
  return sanitizer.sanitize(data);
}
