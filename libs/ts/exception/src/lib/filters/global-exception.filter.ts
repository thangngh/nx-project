import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response, Request } from "express";
import { BaseException } from "../exceptions/base.exception";

export interface ErrorResponseFormat {
  message: string;
  statusCode: string;
  apiUrl: string;
  code: number;
  data: Record<string, unknown> | null;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "exception.internal_server_error";
    let metadata: Record<string, unknown> | null = null;

    if (exception instanceof BaseException) {
      // Handle custom exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? String(exceptionResponse.message)
        : message;
      metadata = exception.metadata;
    } else if (exception instanceof HttpException) {
      // Handle NestJS built-in HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? String(exceptionResponse.message)
        : typeof exceptionResponse === 'string'
          ? exceptionResponse
          : message;
    } else if (exception instanceof Error) {
      // Handle generic errors
      message = exception.message || message;
    }

    const errorResponse: ErrorResponseFormat = {
      message,
      statusCode: status.toString(),
      apiUrl: request.url,
      code: status,
      data: metadata,
    };

    response.status(status).json(errorResponse);
  }
}
