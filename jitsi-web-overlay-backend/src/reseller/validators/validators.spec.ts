import {
  IsValidEmailDomainConstraint,
  IsValidOfferTypeConstraint,
  IsUniqueDomainConstraint,
} from './index';

describe('Email Domain Validator', () => {
  const validator = new IsValidEmailDomainConstraint();

  it('should validate correct domain formats', () => {
    const validDomains = [
      'example.fr',
      'uni-paris.fr',
      'example.co.uk',
      'subdomain.example.com',
      'test-123.org',
    ];

    validDomains.forEach((domain) => {
      expect(validator.validate(domain as any)).toBe(true);
    });
  });

  it('should reject invalid domain formats', () => {
    const invalidDomains = [
      'invalid',
      'invalid_domain',
      'example.',
      '.example.fr',
      'example..fr',
      'example .fr',
      'example@fr',
    ];

    invalidDomains.forEach((domain) => {
      expect(validator.validate(domain as any)).toBe(false);
    });
  });

  it('should have proper error message', () => {
    const message = validator.defaultMessage();
    expect(message).toContain('domaine');
  });
});

describe('OfferType Validator', () => {
  const validator = new IsValidOfferTypeConstraint();

  it('should validate BASIC and PREMIUM', async () => {
    expect(await validator.validate('BASIC' as any)).toBe(true);
    expect(await validator.validate('PREMIUM' as any)).toBe(true);
  });

  it('should reject invalid offer types', async () => {
    expect(await validator.validate('INVALID' as any)).toBe(false);
    expect(await validator.validate('basic' as any)).toBe(false);
  });

  it('should have proper error message', () => {
    const message = validator.defaultMessage({ value: 'INVALID' } as any);
    expect(message).toContain('offerType');
  });
});

describe('Unique Domain Validator', () => {
  let mockClientDomainRepository: any;
  let validator: IsUniqueDomainConstraint;

  beforeEach(() => {
    mockClientDomainRepository = {
      isUnique: jest.fn().mockResolvedValue(true),
    };
    validator = new IsUniqueDomainConstraint(mockClientDomainRepository);
  });

  it('should return true if domain is unique', async () => {
    mockClientDomainRepository.isUnique.mockResolvedValue(true);
    const result = await validator.validate('new-domain.fr' as any, {} as any);
    expect(result).toBe(true);
  });

  it('should return false if domain is already used', async () => {
    mockClientDomainRepository.isUnique.mockResolvedValue(false);
    const result = await validator.validate('existing-domain.fr' as any, {} as any);
    expect(result).toBe(false);
  });

  it('should pass clientId to repository for exclusion', async () => {
    const clientId = 123;
    mockClientDomainRepository.isUnique.mockResolvedValue(true);
    await validator.validate('domain.fr' as any, { constraints: [clientId] } as any);

    expect(mockClientDomainRepository.isUnique).toHaveBeenCalledWith('domain.fr', clientId);
  });

  it('should have proper error message', () => {
    const message = validator.defaultMessage({ value: 'example.fr' } as any);
    expect(message).toContain('Domaine');
    expect(message).toContain('example.fr');
  });
});
