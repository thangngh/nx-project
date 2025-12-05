/**
 * IP Tracking & Security Monitoring
 * 
 * Detects:
 * - Unauthorized access attempts
 * - Suspicious IP patterns
 * - Failed login attacks
 * - Rate limit violations
 * - Geographic anomalies
 */

export interface IPInfo {
  ip: string;
  country?: string;
  city?: string;
  region?: string;
  isp?: string;
  isVPN?: boolean;
  isProxy?: boolean;
  isTor?: boolean;
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface IPAccessLog {
  ip: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  userId?: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
}

export interface IPStatistics {
  ip: string;
  totalRequests: number;
  failedRequests: number;
  successRequests: number;
  firstSeen: Date;
  lastSeen: Date;
  endpoints: Set<string>;
  userAgents: Set<string>;
  userIds: Set<string>;
  suspiciousScore: number; // 0-100
}

export interface SecurityAlert {
  type: 'bruteForce' | 'rateLimitExceeded' | 'suspiciousIP' | 'geoAnomaly' | 'newIPForUser' | 'multipleFailedAttempts';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userId?: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  shouldBlock?: boolean;
}

/**
 * IP Tracking Service
 * Monitors and analyzes IP access patterns
 */
export class IPTracker {
  private ipStats: Map<string, IPStatistics> = new Map();
  private accessLogs: IPAccessLog[] = [];
  private blockedIPs: Set<string> = new Set();
  private whitelistedIPs: Set<string> = new Set();
  private userIPHistory: Map<string, Set<string>> = new Map();

  // Configuration - Memory Management
  private readonly MAX_IPS = 100000; // Limit total IPs tracked (prevents unbounded growth)
  private readonly IP_TTL = 86400000; // 24 hours (IP stats retention)
  private readonly MAX_LOGS = 10000; // Keep last 10k logs
  private readonly CLEANUP_INTERVAL = 3600000; // 1 hour auto-cleanup

  // Security Thresholds
  private readonly FAILED_LOGIN_THRESHOLD = 5; // 5 failed attempts
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly RATE_LIMIT_MAX = 100; // 100 requests per minute

  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor() {
    // Start auto-cleanup (only in Node.js environment)
    if (typeof setInterval !== 'undefined') {
      this.cleanupTimer = setInterval(() => {
        this.autoCleanup();
      }, this.CLEANUP_INTERVAL);
    }
  }

  /**
   * Track an access attempt
   */
  trackAccess(log: IPAccessLog): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];

    // Update statistics
    this.updateStatistics(log);

    // Add to access logs
    this.accessLogs.push(log);
    if (this.accessLogs.length > this.MAX_LOGS) {
      this.accessLogs.shift(); // Remove oldest
    }

    // Check if IP is blocked
    if (this.blockedIPs.has(log.ip)) {
      alerts.push({
        type: 'suspiciousIP',
        severity: 'critical',
        ip: log.ip,
        description: `Blocked IP ${log.ip} attempted access`,
        timestamp: new Date(),
        shouldBlock: true,
      });
      return alerts;
    }

    // Skip whitelist
    if (this.whitelistedIPs.has(log.ip)) {
      return alerts;
    }

    // Check for security issues
    alerts.push(...this.checkBruteForce(log));
    alerts.push(...this.checkRateLimit(log));
    alerts.push(...this.checkGeoAnomaly(log));
    alerts.push(...this.checkNewIPForUser(log));

    return alerts;
  }

  /**
   * Update IP statistics
   */
  private updateStatistics(log: IPAccessLog): void {
    let stats = this.ipStats.get(log.ip);

    if (!stats) {
      stats = {
        ip: log.ip,
        totalRequests: 0,
        failedRequests: 0,
        successRequests: 0,
        firstSeen: log.timestamp,
        lastSeen: log.timestamp,
        endpoints: new Set(),
        userAgents: new Set(),
        userIds: new Set(),
        suspiciousScore: 0,
      };
      this.ipStats.set(log.ip, stats);
    }

    stats.totalRequests++;
    stats.lastSeen = log.timestamp;
    stats.endpoints.add(log.endpoint);

    if (log.userAgent) {
      stats.userAgents.add(log.userAgent);
    }

    if (log.userId) {
      stats.userIds.add(log.userId);

      // Track user IP history
      let userIPs = this.userIPHistory.get(log.userId);
      if (!userIPs) {
        userIPs = new Set();
        this.userIPHistory.set(log.userId, userIPs);
      }
      userIPs.add(log.ip);
    }

    if (log.success) {
      stats.successRequests++;
    } else {
      stats.failedRequests++;
    }

    // Calculate suspicious score
    stats.suspiciousScore = this.calculateSuspiciousScore(stats);
  }

  /**
   * Calculate suspicious score (0-100)
   */
  private calculateSuspiciousScore(stats: IPStatistics): number {
    let score = 0;

    // High failure rate
    const failureRate = stats.failedRequests / stats.totalRequests;
    if (failureRate > 0.5) score += 30;
    else if (failureRate > 0.3) score += 15;

    // Too many user agents (bot-like behavior)
    if (stats.userAgents.size > 10) score += 20;

    // Too many different userIds (account testing)
    if (stats.userIds.size > 5) score += 25;

    // High request volume
    if (stats.totalRequests > 1000) score += 15;

    // Many different endpoints (scanning)
    if (stats.endpoints.size > 50) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Check for brute force attack
   */
  private checkBruteForce(log: IPAccessLog): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];

    if (!log.success) {
      const recentFailed = this.accessLogs.filter(
        l => l.ip === log.ip &&
          !l.success &&
          (log.timestamp.getTime() - l.timestamp.getTime()) < 300000 // Last 5 minutes
      );

      if (recentFailed.length >= this.FAILED_LOGIN_THRESHOLD) {
        alerts.push({
          type: 'bruteForce',
          severity: 'high',
          ip: log.ip,
          userId: log.userId,
          description: `Brute force detected: ${recentFailed.length} failed attempts from ${log.ip}`,
          timestamp: new Date(),
          metadata: {
            failedAttempts: recentFailed.length,
            endpoints: recentFailed.map(l => l.endpoint),
          },
          shouldBlock: recentFailed.length >= this.FAILED_LOGIN_THRESHOLD * 2,
        });

        // Auto-block after 10 failed attempts
        if (recentFailed.length >= this.FAILED_LOGIN_THRESHOLD * 2) {
          this.blockIP(log.ip, `Brute force: ${recentFailed.length} failed attempts`);
        }
      }
    }

    return alerts;
  }

  /**
   * Check for rate limit violations
   */
  private checkRateLimit(log: IPAccessLog): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];

    const recentRequests = this.accessLogs.filter(
      l => l.ip === log.ip &&
        (log.timestamp.getTime() - l.timestamp.getTime()) < this.RATE_LIMIT_WINDOW
    );

    if (recentRequests.length >= this.RATE_LIMIT_MAX) {
      alerts.push({
        type: 'rateLimitExceeded',
        severity: 'medium',
        ip: log.ip,
        description: `Rate limit exceeded: ${recentRequests.length} requests in 1 minute from ${log.ip}`,
        timestamp: new Date(),
        metadata: {
          requestCount: recentRequests.length,
          limit: this.RATE_LIMIT_MAX,
        },
      });
    }

    return alerts;
  }

  /**
   * Check for geographic anomaly
   */
  private checkGeoAnomaly(log: IPAccessLog): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];

    // This would require IP geolocation service
    // Example: If user normally logs in from US, but suddenly from China
    // Implementation would need external service like MaxMind GeoIP2

    return alerts;
  }

  /**
   * Check for new IP for existing user
   */
  private checkNewIPForUser(log: IPAccessLog): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];

    if (log.userId && log.success) {
      const userIPs = this.userIPHistory.get(log.userId);

      if (userIPs && userIPs.size > 0 && !userIPs.has(log.ip)) {
        alerts.push({
          type: 'newIPForUser',
          severity: 'low',
          ip: log.ip,
          userId: log.userId,
          description: `User ${log.userId} logging in from new IP ${log.ip}`,
          timestamp: new Date(),
          metadata: {
            previousIPs: Array.from(userIPs),
          },
        });
      }
    }

    return alerts;
  }

  /**
   * Block an IP address
   */
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    console.warn(`[SECURITY] Blocked IP ${ip}: ${reason}`);
  }

  /**
   * Unblock an IP address
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    console.info(`[SECURITY] Unblocked IP ${ip}`);
  }

  /**
   * Whitelist an IP address
   */
  whitelistIP(ip: string): void {
    this.whitelistedIPs.add(ip);
    this.blockedIPs.delete(ip); // Remove from blocklist if present
  }

  /**
   * Remove from whitelist
   */
  removeFromWhitelist(ip: string): void {
    this.whitelistedIPs.delete(ip);
  }

  /**
   * Check if IP is blocked
   */
  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Check if IP is whitelisted
   */
  isWhitelisted(ip: string): boolean {
    return this.whitelistedIPs.has(ip);
  }

  /**
   * Get IP statistics
   */
  getIPStats(ip: string): IPStatistics | undefined {
    return this.ipStats.get(ip);
  }

  /**
   * Get all suspicious IPs
   */
  getSuspiciousIPs(threshold: number = 70): IPStatistics[] {
    return Array.from(this.ipStats.values())
      .filter(stats => stats.suspiciousScore >= threshold)
      .sort((a, b) => b.suspiciousScore - a.suspiciousScore);
  }

  /**
   * Get recent access logs
   */
  getRecentLogs(limit: number = 100): IPAccessLog[] {
    return this.accessLogs.slice(-limit);
  }

  /**
   * Get logs by IP
   */
  getLogsByIP(ip: string, limit: number = 100): IPAccessLog[] {
    return this.accessLogs
      .filter(log => log.ip === ip)
      .slice(-limit);
  }

  /**
   * Get logs by user
   */
  getLogsByUser(userId: string, limit: number = 100): IPAccessLog[] {
    return this.accessLogs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  /**
   * Clear old logs (cleanup)
   */
  cleanup(olderThan: Date): void {
    this.accessLogs = this.accessLogs.filter(
      log => log.timestamp > olderThan
    );
  }

  /**
   * Auto cleanup - Prevents memory leaks
   * 
   * Runs every hour to:
   * 1. Remove stale IP stats (older than 24h)
   * 2. Cap total IPs (LRU eviction)
   * 3. Remove old logs
   */
  private autoCleanup(): void {
    const now = Date.now();
    const ttl = now - this.IP_TTL;
    const cutoff = new Date(ttl);

    // Step 1: Remove stale IP stats (not seen in 24 hours)
    let removedCount = 0;
    for (const [ip, stats] of this.ipStats.entries()) {
      if (stats.lastSeen.getTime() < ttl) {
        this.ipStats.delete(ip);
        removedCount++;

        // Also clean from user IP history
        this.userIPHistory.forEach(ips => ips.delete(ip));
      }
    }

    // Step 2: Cap total IPs (LRU eviction if over limit)
    if (this.ipStats.size > this.MAX_IPS) {
      const sorted = Array.from(this.ipStats.entries())
        .sort((a, b) => a[1].lastSeen.getTime() - b[1].lastSeen.getTime());

      const toRemove = sorted.slice(0, sorted.length - this.MAX_IPS);
      toRemove.forEach(([ip]) => {
        this.ipStats.delete(ip);
        removedCount++;
      });
    }

    // Step 3: Remove old logs
    const oldLogCount = this.accessLogs.length;
    this.accessLogs = this.accessLogs.filter(log => log.timestamp > cutoff);
    const removedLogs = oldLogCount - this.accessLogs.length;

    // Log cleanup stats
    if (removedCount > 0 || removedLogs > 0) {
      console.log(`[IP Tracker] Cleanup: Removed ${removedCount} stale IPs, ${removedLogs} old logs. Current: ${this.ipStats.size} IPs, ${this.accessLogs.length} logs`);
    }
  }

  /**
   * Manual cleanup trigger
   */
  triggerCleanup(): void {
    this.autoCleanup();
  }

  /**
   * Stop auto cleanup (for testing or shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Get statistics summary with memory info
   */
  getSummary(): {
    totalIPs: number;
    blockedIPs: number;
    whitelistedIPs: number;
    suspiciousIPs: number;
    totalRequests: number;
    totalLogs: number;
    memoryUsage?: number; // MB (Node.js only)
    oldestLog?: Date;
  } {
    const summary: any = {
      totalIPs: this.ipStats.size,
      blockedIPs: this.blockedIPs.size,
      whitelistedIPs: this.whitelistedIPs.size,
      suspiciousIPs: this.getSuspiciousIPs().length,
      totalRequests: Array.from(this.ipStats.values())
        .reduce((sum, stats) => sum + stats.totalRequests, 0),
      totalLogs: this.accessLogs.length,
    };

    // Add memory usage (Node.js only)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      summary.memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    }

    // Add oldest log timestamp
    if (this.accessLogs.length > 0) {
      summary.oldestLog = this.accessLogs[0].timestamp;
    }

    return summary;
  }
}

/**
 * Global IP tracker instance
 */
export const globalIPTracker = new IPTracker();
