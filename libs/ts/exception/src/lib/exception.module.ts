import { Module } from '@nestjs/common';

import { BadRequestException } from './exceptions/bad-request.exception';
import { ForbiddenException } from './exceptions/forbidden.exception';
import { InternalServerException } from './exceptions/internal-server.exception';
import { NotFoundException } from './exceptions/not-found.exception';
import { UnauthorizedException } from './exceptions/unauthorized.exception';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

@Module({
  controllers: [],
  providers: [
    BadRequestException,
    ForbiddenException,
    InternalServerException,
    NotFoundException,
    UnauthorizedException,
    GlobalExceptionFilter,
  ],
  exports: [
    BadRequestException,
    ForbiddenException,
    InternalServerException,
    NotFoundException,
    UnauthorizedException,
    GlobalExceptionFilter,
  ],
})
export class NxProjectNestExceptionModule { }
