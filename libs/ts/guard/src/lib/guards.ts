import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Implement your token validation logic here
    return this.validateToken(token);
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async validateToken(token: string): Promise<boolean> {
    // Implement your token validation logic
    // This is a placeholder - integrate with your auth service
    return !!token;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly requiredRoles: string[]) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      return false;
    }

    return this.requiredRoles.some(role => user.roles.includes(role));
  }
}

@Injectable()
export class ThrottlerGuard implements CanActivate {
  private readonly requests = new Map<string, number[]>();
  private readonly limit: number;
  private readonly ttl: number;

  constructor(limit = 10, ttl = 60000) {
    this.limit = limit;
    this.ttl = ttl;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps
    const validTimestamps = timestamps.filter(time => now - time < this.ttl);

    if (validTimestamps.length >= this.limit) {
      throw new UnauthorizedException('Too many requests');
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }

  private getKey(request: any): string {
    return request.ip || request.connection.remoteAddress;
  }
}
