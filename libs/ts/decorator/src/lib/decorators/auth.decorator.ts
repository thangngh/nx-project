import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const auth = createParamDecorator((_data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getResponse();

  return request.user;
})