import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../entities/api-key.entity';


@Injectable()
export class ApiKeyRepository {
    constructor(
        @InjectRepository(ApiKey)
        private readonly repository: Repository<ApiKey>,
    ) { }

    /**
     * Find API key by its hash
     */
    async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
        return this.repository.findOne({ where: { keyHash } });
    }

    /**
     * Create and save a new API key record
     */
    async create(data: Partial<ApiKey>): Promise<ApiKey> {
        const apiKey = this.repository.create(data);
        return this.repository.save(apiKey);
    }

    /**
     * Find API key by its ID
     */
    async findById(id: number): Promise<ApiKey | null> {
        return this.repository.findOne({ where: { id } });
    }

    /**
     * Find all API keys (should be only a few)
     */
    async findAll(): Promise<ApiKey[]> {
        return this.repository.find();
    }
}
