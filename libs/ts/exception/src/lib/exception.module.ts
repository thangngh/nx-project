import { Module } from '@nestjs/common';

import { BadRequestException } from './exceptions/bad-request.exception';
import { ForbiddenException } from './exceptions/forbidden.exception';
import { InternalServerException } from './exceptions/internal-server.exception';
import { NotFoundException } from './exceptions/not-found.exception';
import { UnauthorizedException } from './exceptions/unauthorized.exception';

@Module({
  controllers: [],
  providers: [
    BadRequestException,
    ForbiddenException,
    InternalServerException,
    NotFoundException,
    UnauthorizedException,
  ],
  exports: [
    BadRequestException,
    ForbiddenException,
    InternalServerException,
    NotFoundException,
    UnauthorizedException,
  ],
})
export class NxProjectNestExceptionModule {}
