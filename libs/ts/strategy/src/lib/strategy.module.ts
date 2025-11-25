import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy, LocalStrategy } from './auth.strategy.ts';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, LocalStrategy],
  exports: [JwtStrategy, LocalStrategy, PassportModule],
})
export class StrategyModule { }
