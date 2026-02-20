import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
    let service: EncryptionService;
    let configService: ConfigService;

    beforeEach(async () => {
        // Créer une clé de chiffrement valide pour les tests (64 chars hex)
        const testKey = 'a'.repeat(64);

        configService = {
            get: jest.fn((key: string) => {
                if (key === 'ENCRYPTION_KEY') return testKey;
                if (key === 'NODE_ENV') return 'test';
                return undefined;
            }),
        } as unknown as ConfigService;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EncryptionService,
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('encrypt', () => {
        it('should encrypt plaintext to IV$AuthTag$Ciphertext format', () => {
            const plaintext = 'mysecret';
            const encrypted = service.encrypt(plaintext);

            const parts = encrypted.split('$');
            expect(parts).toHaveLength(3);
            expect(parts[0]).toMatch(/^[a-f0-9]{32}$/); // IV (16 bytes = 32 hex chars)
            expect(parts[1]).toMatch(/^[a-f0-9]{32}$/); // AuthTag (16 bytes)
            expect(parts[2]).toMatch(/^[a-f0-9]+$/); // Ciphertext (variable length)
        });

        it('should produce different ciphertexts for same plaintext (IV randomness)', () => {
            const plaintext = 'mysecret';
            const cipher1 = service.encrypt(plaintext);
            const cipher2 = service.encrypt(plaintext);

            expect(cipher1).not.toBe(cipher2);

            // But both should decrypt to the same plaintext
            expect(service.decrypt(cipher1)).toBe(plaintext);
            expect(service.decrypt(cipher2)).toBe(plaintext);
        });

        it('should encrypt empty string', () => {
            const encrypted = service.encrypt('');
            const decrypted = service.decrypt(encrypted);
            expect(decrypted).toBe('');
        });

        it('should encrypt long strings', () => {
            const longText = 'a'.repeat(10000);
            const encrypted = service.encrypt(longText);
            const decrypted = service.decrypt(encrypted);
            expect(decrypted).toBe(longText);
        });

        it('should encrypt special characters', () => {
            const special = 'Special: !@#$%^&*()[]{}|\\:";\'<>?,./';
            const encrypted = service.encrypt(special);
            const decrypted = service.decrypt(encrypted);
            expect(decrypted).toBe(special);
        });

        it('should encrypt unicode characters', () => {
            const unicode = '你好世界 مرحبا العالم Привет мир';
            const encrypted = service.encrypt(unicode);
            const decrypted = service.decrypt(encrypted);
            expect(decrypted).toBe(unicode);
        });
    });

    describe('decrypt', () => {
        it('should decrypt valid ciphertext', () => {
            const plaintext = 'mysecret';
            const encrypted = service.encrypt(plaintext);
            const decrypted = service.decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it('should throw on malformed format (missing parts)', () => {
            // Only 2 parts instead of 3
            const malformed = 'a'.repeat(32) + '$' + 'b'.repeat(32);

            expect(() => service.decrypt(malformed)).toThrow(
                'Format de chaîne chiffrée invalide',
            );
        });

        it('should throw when IV length is invalid', () => {
            // Invalid IV length
            const malformed = 'a'.repeat(30) + '$' + 'b'.repeat(32) + '$' + 'c'.repeat(32);

            expect(() => service.decrypt(malformed)).toThrow();
        });

        it('should throw when authTag length is invalid', () => {
            // Valid IV, invalid AuthTag
            const malformed = 'a'.repeat(32) + '$' + 'b'.repeat(30) + '$' + 'c'.repeat(32);

            expect(() => service.decrypt(malformed)).toThrow();
        });

        it('should throw on modified ciphertext (authentication failure)', () => {
            const plaintext = 'mysecret';
            const encrypted = service.encrypt(plaintext);
            const parts = encrypted.split('$');

            // Modify the ciphertext
            const modified = parts[0] + '$' + parts[1] + '$' + 'deadbeef';

            expect(() => service.decrypt(modified)).toThrow(
                'Déchiffrement échoué',
            );
        });

        it('should throw on modified authTag (authentication failure)', () => {
            const plaintext = 'mysecret';
            const encrypted = service.encrypt(plaintext);
            const parts = encrypted.split('$');

            // Modify the auth tag
            const modified = parts[0] + '$' + 'ffff' + parts[1].substring(4) + '$' + parts[2];

            expect(() => service.decrypt(modified)).toThrow(
                'Déchiffrement échoué',
            );
        });
    });

    describe('encryptObject & decryptObject', () => {
        it('should encrypt and decrypt objects', () => {
            const obj = {
                oidcUrl: 'https://oidc.example.com',
                clientId: 'client-123',
                clientSecret: 'secret-xyz',
            };

            const encrypted = service.encryptObject(obj);
            const decrypted = service.decryptObject<typeof obj>(encrypted);

            expect(decrypted).toEqual(obj);
        });

        it('should handle nested objects', () => {
            const obj = {
                nested: {
                    level2: {
                        value: 'deep',
                    },
                },
                array: [1, 2, 3],
            };

            const encrypted = service.encryptObject(obj);
            const decrypted = service.decryptObject<typeof obj>(encrypted);

            expect(decrypted).toEqual(obj);
        });

        it('should handle null and undefined in objects', () => {
            const obj = {
                nullValue: null,
                undefinedValue: undefined,
                validValue: 'ok',
            };

            const encrypted = service.encryptObject(obj);
            const decrypted = service.decryptObject<typeof obj>(encrypted);

            // JSON.stringify converts undefined to undefined (removed from object)
            expect(decrypted.validValue).toBe('ok');
        });

        it('should throw on decryption of non-JSON ciphertext', () => {
            const plaintext = service.encrypt('not-json-{-{-');
            const encrypted = plaintext; // Contains invalid JSON bytes

            expect(() => service.decryptObject(encrypted)).toThrow();
        });
    });

    describe('security properties', () => {
        it('should not leak plaintext in error messages', () => {
            const plaintext = 'super-secret';
            const encrypted = service.encrypt(plaintext);
            const parts = encrypted.split('$');

            // Tamper with ciphertext
            const tampered = parts[0] + '$' + parts[1] + '$deadbeef';

            try {
                service.decrypt(tampered);
                fail('Should have thrown');
            } catch (error) {
                // Error message should not contain the plaintext
                expect(error.message).not.toContain(plaintext);
            }
        });

        it('should use AES-256-GCM (provides authenticated encryption)', () => {
            // GCM mode provides both confidentiality and authenticity
            // Any modification to the ciphertext will be detected
            const plaintext = 'authenticated';
            const encrypted = service.encrypt(plaintext);

            // Change a single bit in the ciphertext
            const parts = encrypted.split('$');
            const cipherBytes = Buffer.from(parts[2], 'hex');
            cipherBytes[0] ^= 0x01; // Flip one bit

            const tampered = parts[0] + '$' + parts[1] + '$' + cipherBytes.toString('hex');

            // Decryption should fail due to authentication failure
            expect(() => service.decrypt(tampered)).toThrow();
        });

        it('should use random IV for each encryption', () => {
            const plaintext = 'test';
            const encrypted1 = service.encrypt(plaintext);
            const encrypted2 = service.encrypt(plaintext);

            const iv1 = encrypted1.split('$')[0];
            const iv2 = encrypted2.split('$')[0];

            expect(iv1).not.toBe(iv2);
        });
    });
});
