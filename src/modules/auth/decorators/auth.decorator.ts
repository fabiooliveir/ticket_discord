import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('🔍 CurrentUser decorator - request.user:', request.user);
    console.log('🔍 CurrentUser decorator - request.user.userId:', request.user?.userId);
    return request.user;
  },
);
