import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Décorateur @CurrentClient()
 *
 * Injecte le client_id actuel du contexte multi-tenant dans un paramètre
 * de contrôleur ou gestionnaire.
 *
 * **Usage dans un Controller** :
 * ```typescript
 * @Get(':uid')
 * async findOne(@CurrentClient() clientId: string) {
 *   return this.clientService.findById(uid, clientId);
 * }
 * ```
 *
 * **Retour** :
 * - UUID du client si configuré en mode multi-tenant
 * - `null` si mode single-tenant
 */
export const CurrentClient = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // Le client_id doit être injecté par ClientGuard dans request.clientId
    // ou via TenantContext depuis un service
    return request.clientId || null;
  },
);
