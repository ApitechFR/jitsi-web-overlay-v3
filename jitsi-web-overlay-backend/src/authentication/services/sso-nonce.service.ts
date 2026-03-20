import { Injectable } from '@nestjs/common';

/**
 * Service pour gérer les nonces (anti-replay)
 * 
 * Stocke les nonces utilisés temporairement (10 minutes)
 * 
 * TODO: En production, utiliser Redis avec TTL:
 * const client = redis.createClient();
 * await client.setex(`nonce:${nonce}`, 600, '1');
 */
@Injectable()
export class SsoNonceService {
    // Map: nonce -> { timestamp, usedAt }
    private usedNonces = new Map<string, { createdAt: number; usedAt?: number }>();

    /**
     * Valider qu'un nonce n'a pas été utilisé
     * Marquer comme utilisé immédiatement
     */
    validateAndMarkNonce(nonce: string): boolean {
        if (!nonce) {
            return false;
        }

        // Vérifier que le nonce existe et n'a pas été utilisé
        if (this.usedNonces.has(nonce)) {
            const entry = this.usedNonces.get(nonce)!;
            if (entry.usedAt !== undefined) {
                // Nonce déjà utilisé → Replay attack!
                return false;
            }
        }

        // Marquer comme utilisé
        this.usedNonces.set(nonce, {
            createdAt: Date.now(),
            usedAt: Date.now(),
        });

        // Nettoyer périodiquement
        this.cleanExpiredNonces();

        return true;
    }

    /**
     * Nettoyer les nonces expirés (> 10 minutes)
     */
    private cleanExpiredNonces(): void {
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10 minutes

        for (const [nonce, entry] of this.usedNonces.entries()) {
            if (now - entry.createdAt > maxAge) {
                this.usedNonces.delete(nonce);
            }
        }

        // Limiter la taille du store (prevent memory leak)
        if (this.usedNonces.size > 10000) {
            // Garder les 5000 plus récents
            const entries = Array.from(this.usedNonces.entries());
            entries.sort((a, b) => b[1].createdAt - a[1].createdAt);

            this.usedNonces.clear();
            entries.slice(0, 5000).forEach(([nonce, entry]) => {
                this.usedNonces.set(nonce, entry);
            });
        }
    }

    /**
     * Générer un nonce aléatoire
     */
    generateNonce(length: number = 32): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Nettoyer tous les nonces (pour tests)
     */
    clearAll(): void {
        this.usedNonces.clear();
    }
}
