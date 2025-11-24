import { HttpException } from "@nestjs/common";

export class BaseException extends HttpException {
  readonly metadata: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    metadata: Record<string, unknown> = {}
  ) {
    super({ statusCode, message }, statusCode);
    this.metadata = metadata;
  }
}