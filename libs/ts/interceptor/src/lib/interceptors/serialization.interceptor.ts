import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { plainToInstance } from "class-transformer";
import type { ClassConstructor } from "class-transformer";

@Injectable()
export class SerializationInterceptor<T> implements NestInterceptor<T, T> {
  constructor(private dto: ClassConstructor<T>) { }

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> | Promise<Observable<T>> {
    return next.handle().pipe(
      map((data: T) => {
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        });
      })
    );
  }
}