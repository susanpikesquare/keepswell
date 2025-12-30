import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  clerkId: string;
  sessionId: string;
  userId?: string; // Our internal user ID
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
