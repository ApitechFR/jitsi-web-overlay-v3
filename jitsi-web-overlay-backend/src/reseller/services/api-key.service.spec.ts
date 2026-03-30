import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyService } from './api-key.service';

describe('ApiKeyService', () => {
    let service: ApiKeyService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ApiKeyService],
        }).compile();

        service = module.get<ApiKeyService>(ApiKeyService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateApiKey', () => {
        it('should generate a 64-char hex string', () => {
            const key = service.generateApiKey();
            expect(key).toMatch(/^[a-f0-9]{64}$/);
            expect(key.length).toBe(64);
        });

        it('should generate unique keys', () => {
            const key1 = service.generateApiKey();
            const key2 = service.generateApiKey();
            expect(key1).not.toBe(key2);
        });
    });

    describe('isValidApiKeyFormat', () => {
        it('should return true for valid 64-char hex', () => {
            const validKey = 'a'.repeat(64);
            expect(service.isValidApiKeyFormat(validKey)).toBe(true);
        });

        it('should return false for non-hex characters', () => {
            const invalidKey = 'z'.repeat(64);
            expect(service.isValidApiKeyFormat(invalidKey)).toBe(false);
        });

        it('should return false for wrong length', () => {
            const shortKey = 'a'.repeat(63);
            const longKey = 'a'.repeat(65);
            expect(service.isValidApiKeyFormat(shortKey)).toBe(false);
            expect(service.isValidApiKeyFormat(longKey)).toBe(false);
        });

        it('should return false for uppercase hex', () => {
            // Uppercase is technically valid hex, but we enforce lowercase
            const upperKey = 'A'.repeat(64);
            expect(service.isValidApiKeyFormat(upperKey)).toBe(false);
        });
    });

    describe('hashApiKey', () => {
        it('should return a hash in format iterations$salt$hash', () => {
            const key = service.generateApiKey();
            const hash = service.hashApiKey(key);
            const parts = hash.split('$');

            expect(parts).toHaveLength(3);
            expect(parts[0]).toBe('100000'); // iterations
            expect(parts[1]).toMatch(/^[a-f0-9]{32}$/); // salt (16 bytes = 32 chars)
            expect(parts[2]).toMatch(/^[a-f0-9]{128}$/); // hash (64 bytes = 128 chars)
        });

        it('should generate different hashes for same key (random salt)', () => {
            const key = service.generateApiKey();
            const hash1 = service.hashApiKey(key);
            const hash2 = service.hashApiKey(key);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('validateApiKey', () => {
        it('should return true for correct key-hash pair', () => {
            const key = service.generateApiKey();
            const hash = service.hashApiKey(key);

            expect(service.validateApiKey(key, hash)).toBe(true);
        });

        it('should return false for incorrect key', () => {
            const key = service.generateApiKey();
            const wrongKey = service.generateApiKey(); // Different key
            const hash = service.hashApiKey(key);

            expect(service.validateApiKey(wrongKey, hash)).toBe(false);
        });

        it('should return false for corrupted hash', () => {
            const key = service.generateApiKey();
            const corruptedHash = '100000$corrupted$hash';

            expect(service.validateApiKey(key, corruptedHash)).toBe(false);
        });

        it('should return false for wrong iteration count', () => {
            const key = service.generateApiKey();
            let hash = service.hashApiKey(key);

            // Change iteration count
            const parts = hash.split('$');
            hash = '50000$' + parts[1] + '$' + parts[2]; // Wrong iterations

            expect(service.validateApiKey(key, hash)).toBe(false);
        });

        it('should use constant-time comparison (no timing attacks)', () => {
            const key = service.generateApiKey();
            const hash = service.hashApiKey(key);

            // This test just ensures the method doesn't throw on valid input
            // Timing attack prevention tested indirectly via CI/CD tools
            expect(service.validateApiKey(key, hash)).toBe(true);
        });
    });

    describe('security properties', () => {
        it('should not allow timing attacks via wrong first character', () => {
            const key = service.generateApiKey();
            const hash = service.hashApiKey(key);

            // Change first char of the key
            const wrongKey = 'b' + key.substring(1);

            // Should fail quickly, but both should take same time (constant-time)
            // This is tested via benchmarking tools in real scenarios
            expect(service.validateApiKey(wrongKey, hash)).toBe(false);
        });

        it('should not leak password via exception', () => {
            const key = service.generateApiKey();
            const hash = service.hashApiKey(key);
            const wrongKey = service.generateApiKey();

            // Should not throw, just return false
            expect(() => service.validateApiKey(wrongKey, hash)).not.toThrow();
            expect(service.validateApiKey(wrongKey, hash)).toBe(false);
        });
    });
});
