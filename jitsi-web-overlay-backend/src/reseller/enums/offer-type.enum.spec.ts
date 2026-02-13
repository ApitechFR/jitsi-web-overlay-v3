import { OfferType } from './offer-type.enum';

describe('OfferType Enum', () => {
    it('should have BASIQUE value', () => {
        expect(OfferType.BASIQUE).toBe('BASIQUE');
    });

    it('should have PREMIUM value', () => {
        expect(OfferType.PREMIUM).toBe('PREMIUM');
    });

    it('should have exactly 2 values', () => {
        const values = Object.values(OfferType);
        expect(values).toHaveLength(2);
    });
});
