import { Injectable, Scope } from '@nestjs/common';
import { ExtendedLoggerService } from './extended-logger.service.ts';
import { globalIPTracker, type IPAccessLog, type SecurityAlert } from './ip-tracker.ts';

/**
 * Security Logger Service
 * 
 * Specialized logger for security events with IP tracking
 * 
 * Features:
 * - Automatic IP tracking
 * - Brute force detection
 * - Rate limit monitoring
 * - Suspicious activity alerts
 * - Auto-blocking malicious IPs
 */
@Injectable({ scope: Scope.TRANSIENT })
export class SecurityLoggerService extends ExtendedLoggerService {

  /**
   * Log authentication attempt with IP tracking
   */
  logAuthAttempt(params: {
    event: 'login' | 'logout' | 'register' | 'passwordReset';
    ip: string;
    userId?: string;
    email?: string;
    success: boolean;
    reason?: string;
    userAgent?: string;
    endpoint?: string;
  }): SecurityAlert[] {
    const { ip, userId, email, success, reason, userAgent, endpoint, event } = params;

    // Track IP access
    const accessLog: IPAccessLog = {
      ip,
      timestamp: new Date(),
      endpoint: endpoint || `/auth/${event}`,
      method: 'POST',
      statusCode: success ? 200 : 401,
      userId,
      userAgent,
      success,
      reason,
    };

    const alerts = globalIPTracker.trackAccess(accessLog);

    // Log authentication event
    this.auth({
      event,
      userId,
      email,
      success,
      reason,
      ip,
      userAgent,
    });

    // Log security alerts
    for (const alert of alerts) {
      this.logSecurityAlert(alert);
    }

    return alerts;
  }

  /**
   * Log HTTP request with IP tracking
   */
  logHTTPRequest(params: {
    ip: string;
    method: string;
    url: string;
    statusCode: number;
    userId?: string;
    userAgent?: string;
  }): SecurityAlert[] {
    const { ip, method, url, statusCode, userId, userAgent } = params;

    // Track IP access
    const accessLog: IPAccessLog = {
      ip,
      timestamp: new Date(),
      endpoint: url,
      method,
      statusCode,
      userId,
      userAgent,
      success: statusCode < 400,
    };

    const alerts = globalIPTracker.trackAccess(accessLog);

    // Log HTTP request
    this.httpRequest({
      method,
      url,
      userId,
    });

    // Log security alerts
    for (const alert of alerts) {
      this.logSecurityAlert(alert);
    }

    return alerts;
  }

  /**
   * Log security alert
   */
  private logSecurityAlert(alert: SecurityAlert): void {
    const emoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨',
    };

    const message = `${emoji[alert.severity]} [SECURITY ${alert.severity.toUpperCase()}] ${alert.type}: ${alert.description}`;

    switch (alert.severity) {
      case 'critical':
      case 'high':
        this.error(message, undefined, {
          ...alert,
          alertType: 'security',
        });
        break;
      case 'medium':
        this.warn(message, {
          ...alert,
          alertType: 'security',
        });
        break;
      case 'low':
        this.log(message, {
          ...alert,
          alertType: 'security',
        });
        break;
    }
  }

  /**
   * Block an IP address
   */
  blockIP(ip: string, reason: string): void {
    globalIPTracker.blockIP(ip, reason);

    this.error(`[SECURITY] IP BLOCKED: ${ip}`, undefined, {
      ip,
      reason,
      action: 'block',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unblock an IP address
   */
  unblockIP(ip: string): void {
    globalIPTracker.unblockIP(ip);

    this.log(`[SECURITY] IP UNBLOCKED: ${ip}`, {
      ip,
      action: 'unblock',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Whitelist an IP address
   */
  whitelistIP(ip: string): void {
    globalIPTracker.whitelistIP(ip);

    this.log(`[SECURITY] IP WHITELISTED: ${ip}`, {
      ip,
      action: 'whitelist',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    return globalIPTracker.isBlocked(ip);
  }

  /**
   * Get IP statistics
   */
  getIPStatistics(ip: string) {
    return globalIPTracker.getIPStats(ip);
  }

  /**
   * Get suspicious IPs
   */
  getSuspiciousIPs(threshold: number = 70) {
    const suspicious = globalIPTracker.getSuspiciousIPs(threshold);

    if (suspicious.length > 0) {
      this.warn(`[SECURITY] Found ${suspicious.length} suspicious IPs`, {
        count: suspicious.length,
        ips: suspicious.map(s => ({
          ip: s.ip,
          score: s.suspiciousScore,
          requests: s.totalRequests,
          failed: s.failedRequests,
        })),
      });
    }

    return suspicious;
  }

  /**
   * Get security summary
   */
  getSecuritySummary() {
    const summary = globalIPTracker.getSummary();

    this.log('[SECURITY] Summary', summary);

    return summary;
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(params: {
    ip: string;
    activity: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }): void {
    const { ip, activity, severity, metadata } = params;

    const alert: SecurityAlert = {
      type: 'suspiciousIP',
      severity,
      ip,
      description: activity,
      timestamp: new Date(),
      metadata,
    };

    this.logSecurityAlert(alert);
  }
}
