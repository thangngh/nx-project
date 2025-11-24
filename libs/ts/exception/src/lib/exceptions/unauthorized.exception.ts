import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class UnauthorizedException extends BaseException {
  constructor(
    message = "exception.unauthorized",
    metadata: Record<string, any> = {}
  ) {
    super(HttpStatus.UNAUTHORIZED, message, metadata);
  }
}