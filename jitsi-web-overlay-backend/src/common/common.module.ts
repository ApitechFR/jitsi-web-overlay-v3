import { Global, Module } from '@nestjs/common';
import { TenantContext } from './context/tenant.context';
import { TenantIsolationService } from './services/tenant-isolation.service';

/**
 * CommonModule - Provides shared services and utilities
 *
 * Providers:
 * - TenantContext : Gestion du contexte client en mode multi-tenant
 * - TenantIsolationService : Helper pour implémenter l'isolation multi-tenant
 *
 * This module is marked @Global() so all services are available
 * throughout the application without explicit imports.
 */
@Global()
@Module({
  providers: [TenantContext, TenantIsolationService],
  exports: [TenantContext, TenantIsolationService],
})
export class CommonModule { }
