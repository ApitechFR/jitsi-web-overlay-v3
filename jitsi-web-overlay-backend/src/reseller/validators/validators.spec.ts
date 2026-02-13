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

  it('should validate BASIQUE and PREMIUM', async () => {
    expect(await validator.validate('BASIQUE' as any)).toBe(true);
    expect(await validator.validate('PREMIUM' as any)).toBe(true);
  });

  it('should reject invalid offer types', async () => {
    expect(await validator.validate('INVALID' as any)).toBe(false);
    expect(await validator.validate('basique' as any)).toBe(false);
  });

  it('should have proper error message', () => {
    const message = validator.defaultMessage({ value: 'INVALID' } as any);
    expect(message).toContain('offerType');
  });
});

describe('Unique Domain Validator', () => {
  const validator = new IsUniqueDomainConstraint();

  it('should always return true (TODO: implement DB check)', async () => {
    // Placeholder: implement when ClientRepository is available
    const result = await validator.validate('any-domain.fr' as any, {} as any);
    expect(result).toBe(true);
  });

  it('should have proper error message', () => {
    const message = validator.defaultMessage({ value: 'example.fr' } as any);
    expect(message).toContain('Domaine');
    expect(message).toContain('example.fr');
  });
});
