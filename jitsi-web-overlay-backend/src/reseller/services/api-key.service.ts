import { Injectable } from '@nestjs/common';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';

/**
 * Service pour gérer les clés API des revendeurs
 * - Hachage PBKDF2 (iterations: 100000)
 * - Génération aléatoire
 * - Validation constant-time
 */
@Injectable()
export class ApiKeyService {
    private readonly ITERATIONS = 100000;
    private readonly KEY_LENGTH = 64;
    private readonly DIGEST = 'sha256';
    private readonly SALT_LENGTH = 16;

    /**
     * Hache une clé API en utilisant PBKDF2
     * @param apiKey Clé API en texte brut
     * @returns Hash au format: iterations$salt$hash
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
     * Valide une clé API contre son hash en temps constant
     * Prévient timing attacks
     * @param apiKey Clé API en texte brut
     * @param hash Hash PBKDF2 stocké en BD
     * @returns true si valide, false sinon
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

            // Comparaison constant-time pour éviter timing attacks
            return timingSafeEqual(
                new Uint8Array(Buffer.from(derivedKey)),
                new Uint8Array(Buffer.from(storedHash)),
            );
        } catch {
            return false;
        }
    }

    /**
     * Génère une nouvelle clé API aléatoire (format: 32 caractères hex)
     * À être stockée EN HASH en BD, jamais en texte brut
     * @returns Clé API aléatoire (32 bytes = 64 chars hex)
     */
    generateApiKey(): string {
        return randomBytes(32).toString('hex');
    }

    /**
     * Valide le format d'une clé API (64 caractères hexadécimaux)
     * À appeler avant de hacher/valider
     * @param apiKey Clé à valider
     * @returns true si format valide
     */
    isValidApiKeyFormat(apiKey: string): boolean {
        return /^[a-f0-9]{64}$/.test(apiKey);
    }
}
