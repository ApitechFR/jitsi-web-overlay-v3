import { Test, TestingModule } from '@nestjs/testing';
import { TenantContext } from './tenant.context';

describe('TenantContext', () => {
  let tenantContext: TenantContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContext],
    }).compile();

    tenantContext = module.get<TenantContext>(TenantContext);
  });

  afterEach(() => {
    tenantContext.clear();
  });

  describe('setClientId & getClientId', () => {
    it('should set and retrieve client_id', () => {
      const clientId = 'client-uuid-123';
      tenantContext.setClientId(clientId);
      expect(tenantContext.getClientId()).toBe(clientId);
    });

    it('should return null when no client_id is set', () => {
      expect(tenantContext.getClientId()).toBeNull();
    });

    it('should allow setting client_id to null', () => {
      tenantContext.setClientId('client-uuid-123');
      tenantContext.setClientId(null);
      expect(tenantContext.getClientId()).toBeNull();
    });
  });

  describe('hasClientId', () => {
    it('should return false when client_id is not set', () => {
      expect(tenantContext.hasClientId()).toBe(false);
    });

    it('should return true when client_id is set', () => {
      tenantContext.setClientId('client-uuid-123');
      expect(tenantContext.hasClientId()).toBe(true);
    });

    it('should return false after clear', () => {
      tenantContext.setClientId('client-uuid-123');
      tenantContext.clear();
      expect(tenantContext.hasClientId()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear the client_id', () => {
      tenantContext.setClientId('client-uuid-123');
      expect(tenantContext.hasClientId()).toBe(true);

      tenantContext.clear();
      expect(tenantContext.hasClientId()).toBe(false);
      expect(tenantContext.getClientId()).toBeNull();
    });
  });

  describe('generateClientId', () => {
    it('should generate a valid UUID v4', () => {
      const clientId = tenantContext.generateClientId();

      // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(clientId).toMatch(uuidPattern);
    });

    it('should generate unique UUIDs', () => {
      const id1 = tenantContext.generateClientId();
      const id2 = tenantContext.generateClientId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('Integration - Context Lifecycle', () => {
    it('should maintain client_id through multiple operations', () => {
      const clientId = 'test-client-123';

      tenantContext.setClientId(clientId);
      expect(tenantContext.hasClientId()).toBe(true);
      expect(tenantContext.getClientId()).toBe(clientId);

      // Simulate another operation
      const requestedId = tenantContext.getClientId();
      expect(requestedId).toBe(clientId);

      // Clear after request
      tenantContext.clear();
      expect(tenantContext.getClientId()).toBeNull();
    });
  });
});
