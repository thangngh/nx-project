import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class ForbiddenException extends BaseException {
  constructor(
    message = "exception.forbidden",
    metadata: Record<string, any> = {}
  ) {
    super(HttpStatus.FORBIDDEN, message, metadata);
  }
}