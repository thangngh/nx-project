import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  email: string;
  roles?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
    };
  }
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor() {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    // Implement your user validation logic here
    // This is a placeholder
    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { email };
  }
}
