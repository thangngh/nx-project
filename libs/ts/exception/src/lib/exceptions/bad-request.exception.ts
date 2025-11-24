import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class BadRequestException extends BaseException {
  constructor(
    message = "exception.bad_request",
    metadata: Record<string, any> = {}
  ) {
    super(HttpStatus.BAD_REQUEST, message, metadata);
  }
}