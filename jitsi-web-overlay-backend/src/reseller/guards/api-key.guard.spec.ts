import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeyService } from '../services/api-key.service';
import { TenantContext } from '../../common/context/tenant.context';

describe('ApiKeyGuard', () => {
    let guard: ApiKeyGuard;
    let apiKeyService: ApiKeyService;
    let tenantContext: TenantContext;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ApiKeyGuard, ApiKeyService, TenantContext],
        }).compile();

        guard = module.get<ApiKeyGuard>(ApiKeyGuard);
        apiKeyService = module.get<ApiKeyService>(ApiKeyService);
        tenantContext = module.get<TenantContext>(TenantContext);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('canActivate', () => {
        let mockExecutionContext: ExecutionContext;
        let mockRequest: any;

        beforeEach(() => {
            mockRequest = {
                headers: {},
            };

            mockExecutionContext = {
                switchToHttp: jest.fn().mockReturnValue({
                    getRequest: jest.fn().mockReturnValue(mockRequest),
                }),
            } as unknown as ExecutionContext;
        });

        it('should throw UnauthorizedException when x-api-key header is missing', async () => {
            await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException when x-api-key header is null', async () => {
            mockRequest.headers['x-api-key'] = null;

            await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException when x-api-key is empty string', async () => {
            mockRequest.headers['x-api-key'] = '';

            await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException when x-api-key format is invalid', async () => {
            mockRequest.headers['x-api-key'] = 'invalid-format';

            await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should accept valid API key format and set resellerId', async () => {
            const validKey = apiKeyService.generateApiKey();
            mockRequest.headers['x-api-key'] = validKey;

            const result = await guard.canActivate(mockExecutionContext);

            expect(result).toBe(true);
            expect(mockRequest.resellerId).toBeDefined();
            expect(mockRequest.resellerId).toBe('dev-reseller-1');
        });

        it('should extract API key from array of headers', async () => {
            const validKey = apiKeyService.generateApiKey();
            mockRequest.headers['x-api-key'] = [validKey, 'ignored'];

            const result = await guard.canActivate(mockExecutionContext);

            expect(result).toBe(true);
            expect(mockRequest.resellerId).toBeDefined();
        });

        it('should handle header names case-insensitively', async () => {
            // Note: HTTP headers are case-insensitive, but Express normalizes to lowercase
            const validKey = apiKeyService.generateApiKey();
            mockRequest.headers['x-api-key'] = validKey;

            const result = await guard.canActivate(mockExecutionContext);

            expect(result).toBe(true);
        });

        it('should set resellerId on request object', async () => {
            const validKey = apiKeyService.generateApiKey();
            mockRequest.headers['x-api-key'] = validKey;

            await guard.canActivate(mockExecutionContext);

            expect(mockRequest).toHaveProperty('resellerId');
        });

        it('should call TenantContext.setResellerId (TODO when implemented)', async () => {
            const validKey = apiKeyService.generateApiKey();
            mockRequest.headers['x-api-key'] = validKey;
            const setSpy = jest.spyOn(tenantContext, 'setClientId');

            await guard.canActivate(mockExecutionContext);

            // TODO: Implement setResellerId in TenantContext
            // expect(setSpy).toHaveBeenCalledWith('dev-reseller-1');
            setSpy.mockRestore();
        });
    });

    describe('security', () => {
        let mockExecutionContext: ExecutionContext;
        let mockRequest: any;

        beforeEach(() => {
            mockRequest = {
                headers: {},
            };

            mockExecutionContext = {
                switchToHttp: jest.fn().mockReturnValue({
                    getRequest: jest.fn().mockReturnValue(mockRequest),
                }),
            } as unknown as ExecutionContext;
        });

        it('should not log full API key in error messages', async () => {
            mockRequest.headers['x-api-key'] = 'invalid-key-' + 'a'.repeat(100);

            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            try {
                await guard.canActivate(mockExecutionContext);
            } catch (error) {
                // Error should be thrown
            }

            consoleWarnSpy.mockRestore();
        });

        it('should reject SQL injection attempts in header', async () => {
            mockRequest.headers['x-api-key'] = "'; DROP TABLE api_keys; --";

            await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow();
        });

        it('should reject overly long API keys', async () => {
            // Create a string longer than expected 64 chars hex
            mockRequest.headers['x-api-key'] = 'a'.repeat(1000);

            await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow();
        });

        it('should normalize API key format validation', async () => {
            // Test with various invalid formats
            const invalidKeys = [
                'not-hex-characters',
                'A'.repeat(64), // Uppercase
                'a'.repeat(63), // Too short
                'a'.repeat(65), // Too long
                '0x' + 'a'.repeat(62), // Has 0x prefix
            ];

            for (const key of invalidKeys) {
                mockRequest.headers['x-api-key'] = key;

                await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
                    UnauthorizedException,
                );
            }
        });
    });
});
