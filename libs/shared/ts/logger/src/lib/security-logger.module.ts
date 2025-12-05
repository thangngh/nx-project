import { Module, Global } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service.ts';
import { ExtendedLoggerService } from './extended-logger.service.ts';
import { SecurityLoggerService } from './security-logger.service.ts';

/**
 * Security Logger Module
 * 
 * Provides security logging with IP tracking and threat detection
 * 
 * Features:
 * - ✅ IP tracking & monitoring
 * - ✅ Brute force detection
 * - ✅ Rate limit enforcement
 * - ✅ Suspicious activity alerts
 * - ✅ Auto-blocking malicious IPs
 * - ✅ Geo-anomaly detection
 * - ✅ Failed login tracking
 * - ✅ Security summary reports
 * 
 * Usage:
 * 
 * @Module({
 *   imports: [SecurityLoggerModule],
 * })
 * export class AppModule {}
 * 
 * In Auth Service:
 * constructor(private readonly securityLogger: SecurityLoggerService) {
 *   this.securityLogger.setContext('AuthService');
 * }
 * 
 * async login(email: string, password: string, req: Request) {
 *   try {
 *     const user = await this.validateCredentials(email, password);
 *     
 *     // Log successful login with IP tracking
 *     const alerts = this.securityLogger.logAuthAttempt({
 *       event: 'login',
 *       ip: req.ip,
 *       userId: user.id,
 *       email,
 *       success: true,
 *       userAgent: req.headers['user-agent'],
 *     });
 *     
 *     // Handle alerts
 *     if (alerts.some(a => a.severity === 'critical')) {
 *       // Send notification to security team
 *     }
 *     
 *     return this.generateToken(user);
 *   } catch (error) {
 *     // Log failed login with IP tracking
 *     const alerts = this.securityLogger.logAuthAttempt({
 *       event: 'login',
 *       ip: req.ip,
 *       email,
 *       success: false,
 *       reason: error.message,
 *       userAgent: req.headers['user-agent'],
 *     });
 *     
 *     // Check if IP should be blocked
 *     if (alerts.some(a => a.shouldBlock)) {
 *       this.securityLogger.blockIP(req.ip, 'Too many failed attempts');
 *     }
 *     
 *     throw error;
 *   }
 * }
 * 
 * IP Management:
 * 
 * // Block malicious IP
 * securityLogger.blockIP('192.168.1.100', 'Brute force attack detected');
 * 
 * // Whitelist trusted IP
 * securityLogger.whitelistIP('10.0.0.1');
 * 
 * // Check IP status
 * if (securityLogger.isIPBlocked(req.ip)) {
 *   throw new ForbiddenException('IP blocked');
 * }
 * 
 * // Get suspicious IPs
 * const suspicious = securityLogger.getSuspiciousIPs(70); // Score >= 70
 * 
 * // Get security summary
 * const summary = securityLogger.getSecuritySummary();
 */
@Global()
@Module({
  providers: [WinstonLoggerService, ExtendedLoggerService, SecurityLoggerService],
  exports: [WinstonLoggerService, ExtendedLoggerService, SecurityLoggerService],
})
export class SecurityLoggerModule { }
