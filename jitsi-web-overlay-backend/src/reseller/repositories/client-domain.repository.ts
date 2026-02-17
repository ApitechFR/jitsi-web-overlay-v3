import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientDomain } from '../entities/client-domain.entity';

@Injectable()
export class ClientDomainRepository {
    constructor(
        @InjectRepository(ClientDomain)
        private readonly repository: Repository<ClientDomain>,
    ) { }

    /**
     * Find a client domain by domain name
     * @param domainName The domain name to search for
     * @returns ClientDomain if exists, null otherwise
     */
    async findByDomainName(domainName: string): Promise<ClientDomain | null> {
        return this.repository.findOne({ where: { domainName } });
    }

    /**
     * Check if a domain is already used by another client
     * @param domainName The domain name to check
     * @param excludeClientId Optional: exclude a specific client (for updates)
     * @returns true if domain is available, false if already used
     */
    async isUnique(domainName: string, excludeClientId?: number): Promise<boolean> {
        const existing = await this.repository.findOne({
            where: { domainName },
            relations: ['client'],
        });

        if (!existing) {
            return true; // Domain not used
        }

        // If we're excluding a client, check if the domain belongs to that client
        if (excludeClientId && existing.client.id === excludeClientId) {
            return true; // Domain belongs to the client we're updating, so it's unique
        }

        return false; // Domain is used by another client
    }
}
