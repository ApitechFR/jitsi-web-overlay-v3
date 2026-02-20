import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator @CurrentClient() - Extract reseller ID from request
 * 
 * The ApiKeyGuard injects resellerId into request.resellerId
 * This decorator extracts and provides it to controller methods
 * 
 * Usage:
 * async createClient(
 *   @Body() dto: CreateClientDto,
 *   @CurrentClient() resellerId: string
 * )
 */
export const CurrentClient = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.resellerId;
  },
);
