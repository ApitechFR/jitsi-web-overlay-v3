import { Injectable } from '@nestjs/common';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { ApiKeyRepository } from '../repositories/api-key.repository';
import { ApiKeyResponseDto } from '../dto/api-key.dto';

/**
 * Manage API keys for resellers
 * - Generate unique API keys
 * - Hash with PBKDF2
 * - Store only the hash (never the raw key)
 * - Validate keys in constant time to prevent timing attacks
 */
@Injectable()
export class ApiKeyService {
    private readonly ITERATIONS = 100000;
    private readonly KEY_LENGTH = 64;
    private readonly DIGEST = 'sha256';
    private readonly SALT_LENGTH = 16;

    constructor(private readonly apiKeyRepository: ApiKeyRepository) { }

    /**
     * Hash  a plaintext API key using PBKDF2
     * @param apiKey API key in plaintext
     * @returns Hash string in the format: iterations$salt$derivedKey
     */
    hashApiKey(apiKey: string): string {
        const salt = randomBytes(this.SALT_LENGTH).toString('hex');
        const derivedKey = pbkdf2Sync(
            apiKey,
            salt,
            this.ITERATIONS,
            this.KEY_LENGTH,
            this.DIGEST,
        ).toString('hex');

        return `${this.ITERATIONS}$${salt}$${derivedKey}`;
    }

    /**
     * Validate a plaintext API key against a stored hash
     * Performs a constant-time comparison to prevent timing attacks
     * @param apiKey API key in plaintext
     * @param hash PBKDF2 hash stored in DB
     * @returns true if valid, false otherwise
     */
    validateApiKey(apiKey: string, hash: string): boolean {
        try {
            const [iterationsStr, salt, storedHash] = hash.split('$');
            const iterations = Number.parseInt(iterationsStr, 10);

            if (iterations !== this.ITERATIONS) {
                return false;
            }

            const derivedKey = pbkdf2Sync(
                apiKey,
                salt,
                iterations,
                this.KEY_LENGTH,
                this.DIGEST,
            ).toString('hex');

            // Constante-time comparison to prevent timing attacks
            return timingSafeEqual(
                new Uint8Array(Buffer.from(derivedKey)),
                new Uint8Array(Buffer.from(storedHash)),
            );
        } catch {
            return false;
        }
    }

    /**
     * Generate a random API key (plaintext)
     * @returns A new API key in plaintext
     */
    generateApiKey(): string {
        return randomBytes(32).toString('hex');
    }

    /**
     * Generate and store an API key
     *  Returns the API key in plaintext (only once!)
     */
    async generateAndStoreApiKey(): Promise<ApiKeyResponseDto> {
        // Generate a new API key in plaintext
        const apiKey = this.generateApiKey();

        // Hash the API key for secure storage
        const keyHash = this.hashApiKey(apiKey);

        // Store the hash in the database (never store the plaintext key)
        const apiKeyRecord = await this.apiKeyRepository.create({
            keyHash,
        });

        // Return the plaintext API key to the caller (only once!)
        return {
            id: apiKeyRecord.id,
            apiKey,
            createdAt: apiKeyRecord.createdAt,
            message: 'WARNING: This API key will only be shown once. Please store it securely. It cannot be retrieved again.',
        };
    }
}
