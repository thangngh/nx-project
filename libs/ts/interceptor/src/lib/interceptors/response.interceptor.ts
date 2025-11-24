import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ResponseFormat<T> {
  message: string;
  statusCode: string;
  apiUrl: string;
  code: number;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ResponseFormat<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data: T) => {
        return {
          message: "system_code.success",
          statusCode: response.statusCode.toString(),
          apiUrl: request.url,
          code: response.statusCode,
          data,
        };
      })
    );
  }
}