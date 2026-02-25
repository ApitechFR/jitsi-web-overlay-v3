import { Repository, SelectQueryBuilder } from 'typeorm';
import { TenantContext } from '../context/tenant.context';

/**
 * TenantAwareRepository - Base class pour les repositories multi-tenant
 *
 * Fourni des methodes utilitaires pour filtrer automatiquement par clientId
 * dans les queries TypeORM.
 *
 * Usage:
 * ```typescript
 * export class ConferenceRepository extends TenantAwareRepository<Conference> {
 *   constructor(
 *     @InjectRepository(Conference) repo: Repository<Conference>,
 *     tenantContext: TenantContext,
 *   ) {
 *     super(repo, tenantContext);
 *   }
 *
 *   async findByRoom(roomUid: string) {
 *     return this.find()
 *       .where('conference.room_uid = :roomUid', { roomUid })
 *       .getMany();
 *   }
 * }
 * ```
 */
export class TenantAwareRepository<T> {
    constructor(
        protected readonly repository: Repository<T>,
        protected readonly tenantContext: TenantContext,
    ) { }

    /**
     * Gets the clientId from the current context
     */
    protected getClientId(): string | null {
        return this.tenantContext.getClientId();
    }

    /**
     * Creates a QueryBuilder with automatic clientId isolation
     *
     * Usage:
     * ```typescript
     * const qb = this.createQueryBuilder('conference');
     * qb.where('conference.name ILIKE :name', { name: `%${term}%` });
     * return qb.getMany();
     * ```
     */
    createQueryBuilder(alias: string): SelectQueryBuilder<T> {
        const qb = this.repository.createQueryBuilder(alias);

        // Apply clientId filter for multi-tenant isolation
        const clientId = this.getClientId();
        if (clientId) {
            qb.andWhere(`${alias}.client_id = :clientId`, { clientId });
        }

        return qb;
    }

    /**
     * Find with automatic clientId isolation
     *
     * Usage:
     * ```typescript
     * const conference = await this.find((qb) =>
     *   qb.where('conference.uid = :uid', { uid })
     * );
     * ```
     */
    async find(
        builder?: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>,
    ): Promise<T[]> {
        let qb = this.repository.createQueryBuilder();

        // Apply clientId filter for multi-tenant isolation
        const clientId = this.getClientId();
        if (clientId) {
            // Note: Default alias is "query_1" when no alias is provided in createQueryBuilder
            //  but for better usage, pass alias as parameter

            qb = qb.where('query_1.client_id = :clientId', { clientId });
        }

        // Apply additional filters from builder
        if (builder) {
            qb = builder(qb);
        }

        return qb.getMany();
    }

    /**
     * FindOne with automatic clientId isolation
     */
    async findOne(
        builder?: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>,
    ): Promise<T | null> {
        let qb = this.repository.createQueryBuilder();

        // Apply clientId filter for multi-tenant isolation
        const clientId = this.getClientId();
        if (clientId) {
            qb = qb.where('query_1.client_id = :clientId', { clientId });
        }

        // Apply additional filters from builder
        if (builder) {
            qb = builder(qb);
        }

        const result = await qb.getOne();
        return result || null;
    }

    /**
     * Count with automatic clientId isolation
     */
    async count(
        builder?: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>,
    ): Promise<number> {
        let qb = this.repository.createQueryBuilder();

        // Apply clientId filter for multi-tenant isolation
        const clientId = this.getClientId();
        if (clientId) {
            qb = qb.where('query_1.client_id = :clientId', { clientId });
        }

        // Apply additional filters from builder
        if (builder) {
            qb = builder(qb);
        }

        return qb.getCount();
    }

    /**
     * Save with automatic clientId injection
     *
     * clientId will be injected into the entity before saving if it's in multi-tenant mode
     */
    async save(entity: T | T[]): Promise<T | T[]> {
        const clientId = this.getClientId();

        if (Array.isArray(entity)) {
            // for batch save, inject clientId into each entity
            const entities = entity.map((e: any) => {
                if (clientId && 'client_id' in e) {
                    e.client_id = clientId;
                }
                return e;
            });
            return this.repository.save(entities);
        }

        // for single entity, inject clientId if applicable
        const entityAny = entity as any;
        if (clientId && 'client_id' in entityAny) {
            entityAny.client_id = clientId;
        }

        return this.repository.save(entity);
    }

    /**
     * Delete with automatic clientId isolation
     */
    async delete(
        builder?: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>,
    ): Promise<number> {
        let qb = this.repository.createQueryBuilder();

        // Apply clientId filter for multi-tenant isolation
        const clientId = this.getClientId();
        if (clientId) {
            qb = qb.where('query_1.client_id = :clientId', { clientId });
        }

        // Apply additional filters from builder
        if (builder) {
            qb = builder(qb);
        }

        const result = await qb.delete().execute();
        return result.affected || 0;
    }

    /**
     * Decorator helper to apply clientId filter to a QueryBuilder
     *
     * Usage:
     * ```typescript
     * const qb = this.repository.createQueryBuilder('conference');
     * this.applyClientFilter(qb, 'conference');
     * ```
     */
    protected applyClientFilter(qb: SelectQueryBuilder<T>, alias: string): SelectQueryBuilder<T> {
        const clientId = this.getClientId();
        if (clientId) {
            qb.andWhere(`${alias}.client_id = :clientId`, { clientId });
        }
        return qb;
    }
}
