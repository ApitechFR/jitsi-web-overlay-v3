import { OfferType } from './offer-type.enum';

describe('OfferType Enum', () => {
    it('should have BASIC value', () => {
        expect(OfferType.BASIC).toBe('BASIC');
    });

    it('should have PREMIUM value', () => {
        expect(OfferType.PREMIUM).toBe('PREMIUM');
    });

    it('should have exactly 2 values', () => {
        const values = Object.values(OfferType);
        expect(values).toHaveLength(2);
    });
});
