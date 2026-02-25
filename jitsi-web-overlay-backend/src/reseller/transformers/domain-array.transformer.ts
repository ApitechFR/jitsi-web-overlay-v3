import { plainToInstance, Transform } from 'class-transformer';
import { DomainDto } from '../dto/client.dto';

/**
 * Transformer for domains array that accepts both:
 * - String array: ["visio.apitech.fr", "autre.fr"]
 * - Object array: [{domain: "visio.apitech.fr"}]
 * 
 * Converts strings to DomainDto objects for validation
 */
export function TransformDomainArray() {
    return Transform(({ value }) => {
        if (!value) return value;
        if (!Array.isArray(value)) return value;

        return value.map((item) => {
            // If it's a string, wrap it in DomainDto object
            if (typeof item === 'string') {
                return plainToInstance(DomainDto, { domain: item });
            }
            // If it's already an object, convert to DomainDto instance
            return plainToInstance(DomainDto, item);
        });
    });
}
