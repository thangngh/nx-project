import { Module } from '@nestjs/common';
import { AuthGuard, RolesGuard, ThrottlerGuard } from './guards.ts';

@Module({
  providers: [AuthGuard, RolesGuard, ThrottlerGuard],
  exports: [AuthGuard, RolesGuard, ThrottlerGuard],
})
export class GuardModule { }
