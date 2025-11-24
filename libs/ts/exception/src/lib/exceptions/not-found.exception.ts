import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class NotFoundException extends BaseException {
  constructor(
    message = "exception.not_found",
    metadata: Record<string, any> = {}
  ) {
    super(HttpStatus.NOT_FOUND, message, metadata);
  }
}