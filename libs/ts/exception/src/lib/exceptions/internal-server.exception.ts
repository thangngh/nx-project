import { HttpStatus } from "@nestjs/common";

import { BaseException } from "./base.exception";

export class InternalServerException extends BaseException {
  constructor(
    message = "exception.internal_server_error",
    metadata: Record<string, any> = {}
  ) {
    super(HttpStatus.INTERNAL_SERVER_ERROR, message, metadata);
  }
}