import { HttpException } from "@nestjs/common";

export class BaseException extends HttpException {
  readonly metadata: Record<string, any>;

  constructor(
    statusCode: number,
    message: string,
    metadata: Record<string, any> = {}
  ) {
    super({ statusCode, message }, statusCode);
    this.metadata = metadata;
  }
}