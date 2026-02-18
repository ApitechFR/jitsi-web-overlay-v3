import { Injectable } from '@nestjs/common';
import { TenantContext } from '../context/tenant.context';

/**
 * TenantIsolationService - Service helper pour implémenter l'isolation multi-tenant
 *
 * Fournit des utilitaires pour:
 * - Vérifier l'isolation multi-tenant
 * - Valider que les entités appartiennent au client actuel
 * - Gérer les paramètres de requête liés au clientId
 *
 * Usage dans les services:
 * ```typescript
 * @Injectable()
 * export class ConferenceService {
 *   constructor(
 *     private readonly tenantIsolation: TenantIsolationService,
 *     private readonly conferenceRepository: Repository<Conference>,
 *   ) {}
 *
 *   async getConference(uid: string): Promise<Conference> {
 *     const clientId = this.tenantIsolation.getClientId();
 *
 *     const query = this.conferenceRepository.createQueryBuilder('conference')
 *       .where('conference.uid = :uid', { uid });
 *
 *     // Ajouter filtre clientId si mode multi-tenant
 *     if (clientId) {
 *       query.andWhere('conference.client_id = :clientId', { clientId });
 *     }
 *
 *     return query.getOne();
 *   }
 * }
 * ```
 */
@Injectable()
export class TenantIsolationService {
    constructor(private readonly tenantContext: TenantContext) { }


    /**
     * Gets the clientId from the current context
     * Returns null in single-tenant mode
     */
    getClientId(): string | null {
        return this.tenantContext.getClientId();
    }

    /**
     * Checks if the application is running in multi-tenant mode (i.e. clientId is set)
     */
    isMultiTenantMode(): boolean {
        return this.tenantContext.hasClientId();
    }

    /**
     * Validates that an entity belongs to the current client
     *
     * Usage:
     * ```typescript
     * const conference = await this.conferenceRepository.findOne({ where: { uid } });
     * this.tenantIsolation.validateOwnership(conference, 'conference');
     * // Lance NotFoundException si clientId ne correspond pas
     * ```
     */
    validateOwnership(entity: any, entityName: string = 'entity'): boolean {
        const clientId = this.getClientId();

        // single-tenant mode: no clientId, all entities are valid
        if (!clientId) {
            return true;
        }

        // multi-tenant mode: entity must have matching clientId
        if (!entity?.client_id || entity.client_id !== clientId) {
            throw new Error(
                `Access denied: ${entityName} does not belong to the current client. Expected client_id: ${clientId}, got: ${entity?.client_id}`,
            );
        }

        return true;
    }

    /**
     * Injects the clientId into an entity before saving to the database
     *
     * Usage:
     * ```typescript
     * const conference = new Conference();
     * conference.name = 'My Conference';
     * this.tenantIsolation.injectClientId(conference);
     * await this.conferenceRepository.save(conference);
     * ```
     */
    injectClientId(entity: any): void {
        const clientId = this.getClientId();
        if (clientId) {
            entity.client_id = clientId;
        }
    }

    /**
     * Creates a QueryBuilder with automatic clientId isolation
     *
     * Usage:
     * ```typescript
     * const query = this.conferenceRepository.createQueryBuilder('conference')
     *   .where('conference.name = :name', { name, ...this.tenantIsolation.getQueryParams() });
     * ```
     */
    getQueryParams(): Record<string, any> {
        const clientId = this.getClientId();
        if (!clientId) {
            return {};
        }

        return { clientId };
    }

    /**
     * Adds a clientId filter to a QueryBuilder for multi-tenant isolation
     *
     * Usage:
     * ```typescript
     * const query = this.conferenceRepository.createQueryBuilder('conference');
     * this.tenantIsolation.applyClientFilter(query, 'conference');
     * return query.getMany();
     * ```
     */
    applyClientFilter(query: any, alias: string = 'entity'): void {
        const clientId = this.getClientId();
        if (clientId) {
            query.andWhere(`${alias}.client_id = :clientId`, { clientId });
        }
    }

    /**
     * Validates that a batch of entities belong to the current client
     *
     * Usage:
     * ```typescript
     * const conferences = await this.conferenceRepository.find();
     * this.tenantIsolation.validateOwnershipBatch(conferences, 'conference');
     * ```
     */
    validateOwnershipBatch(entities: any[], entityName: string = 'entities'): boolean {
        for (const entity of entities) {
            this.validateOwnership(entity, entityName);
        }
        return true;
    }
}
