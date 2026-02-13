import { Global, Module } from '@nestjs/common';
import { TenantContext } from './context/tenant.context';

/**
 * CommonModule - Provides shared services and utilities
 *
 * Providers:
 * - TenantContext : Gestion du contexte client en mode multi-tenant
 *
 * This module is marked @Global() so all services are available
 * throughout the application without explicit imports.
 */
@Global()
@Module({
  providers: [TenantContext],
  exports: [TenantContext],
})
export class CommonModule {}
