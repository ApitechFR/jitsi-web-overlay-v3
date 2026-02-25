import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createSecretKey, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';

/**
 * Service pour chiffrement/déchiffrement des secrets sensibles
 * Utilise AES-256-GCM pour chiffrer les secrets.
 * 
 * Format stocké en BD: IV(16)$AUTHtag(16)$CIPHERTEXT
 * Tous les composants en hexadécimal, séparés par $
 */
@Injectable()
export class EncryptionService {
    private readonly ALGORITHM = 'aes-256-gcm';
    private readonly KEY_LENGTH = 32; // 256 bits
    private readonly IV_LENGTH = 16;
    private readonly AUTH_TAG_LENGTH = 16;

    private encryptionKey: Buffer;

    constructor(private readonly configService: ConfigService) {
        this.initializeEncryptionKey();
    }

    /**
     * Initialise la clé de chiffrement depuis .env
     * ENCRYPTION_KEY doit être une chaîne hexadécimale de 64 caractères (32 bytes)
     * Si absent, génère une clé depuis NODE_ENV pour dev (JAMAIS en prod)
     */
    private initializeEncryptionKey(): void {
        let keyString = this.configService.get<string>('ENCRYPTION_KEY');

        if (!keyString) {
            // Mode DEV: générer une clé déterministe depuis NODE_ENV
            const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
            keyString = this.generateDeterministicKey(nodeEnv);
            console.warn(
                '[EncryptionService] ENCRYPTION_KEY is not set. Using a deterministic key for development. DO NOT USE THIS IN PRODUCTION.',
            );
        }

        // Valider que c'est bien 64 chars hex (32 bytes)
        if (!/^[a-f0-9]{64}$/i.test(keyString)) {
            throw new Error(
                'ENCRYPTION_KEY invalid: must be a 64-character hexadecimal string (32 bytes)',
            );
        }

        this.encryptionKey = Buffer.from(keyString, 'hex');
    }

    /**
     * Génère une clé déterministe pour le développement
     * À NE PAS utiliser en production
     */
    private generateDeterministicKey(seed: string): string {
        return createHash('sha256').update(seed + '-jitsi-overlay-v3').digest('hex');
    }

    /**
     * Chiffre un secret en AES-256-GCM
     * @param plaintext Secret en texte brut
     * @returns Chaîne chiffrée au format: IV(hex)$AUTHTAG(hex)$CIPHERTEXT(hex)
     */
    encrypt(plaintext: string): string {
        const iv = randomBytes(this.IV_LENGTH);

        //  KeyObject au lieu de Buffer => plus d’erreur TS
        const key = createSecretKey(this.encryptionKey);
        const cipher = createCipheriv(this.ALGORITHM, key, iv);

        const ciphertextHex = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]).toString('hex');

        const authTagHex = cipher.getAuthTag().toString('hex');

        return `${iv.toString('hex')}$${authTagHex}$${ciphertextHex}`;
    }

    /**
     * Déchiffre un secret chiffré
     * @param encrypted Chaîne chiffrée au format IV$AUTHtag$CIPHERTEXT
     * @returns Secret en texte brut
     * @throws Erreur si format invalide ou authentification échoue
     */
    decrypt(encrypted: string): string {
        try {
            const parts = encrypted.split('$');
            if (parts.length !== 3) throw new Error('Format de chaîne chiffrée invalide');

            const [ivHex, authTagHex, ciphertextHex] = parts;

            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const ciphertext = Buffer.from(ciphertextHex, 'hex');

            if (iv.length !== this.IV_LENGTH) {
                throw new Error(`IV invalide: length ${iv.length}, attendu ${this.IV_LENGTH}`);
            }
            if (authTag.length !== this.AUTH_TAG_LENGTH) {
                throw new Error(`AuthTag invalide: length ${authTag.length}, attendu ${this.AUTH_TAG_LENGTH}`);
            }

            const key = createSecretKey(this.encryptionKey);
            const decipher = createDecipheriv(this.ALGORITHM, key, iv);

            decipher.setAuthTag(new Uint8Array(authTag));

            const plaintext = Buffer.concat([
                decipher.update(ciphertext),
                decipher.final(),
            ]).toString('utf8');

            return plaintext;
        } catch (error: any) {
            throw new Error(`Erreur de déchiffrement: ${error?.message ?? String(error)}`);
        }
    }
    /**
     * Chiffre un objet JSON
     * @param obj Objet à chiffrer
     * @returns Objet chiffré au format IV$AUTHAG$CIPHERTEXT
     */
    encryptObject<T>(obj: T): string {
        return this.encrypt(JSON.stringify(obj));
    }

    /**
     * Déchiffre un objet JSON
     * @param encrypted Chaîne chiffrée
     * @returns Objet déchiffré
     */
    decryptObject<T>(encrypted: string): T {
        const plaintext = this.decrypt(encrypted);
        return JSON.parse(plaintext);
    }
}
