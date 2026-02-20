import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * TenantContext Service
 *
 * Gère le contexte du client actuel dans une requête multi-tenant.
 * Stocke et récupère le client_id pour chaque tenant isolé.
 *
 * **Usage** :
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private tenantContext: TenantContext) {}
 *
 *   doSomething() {
 *     const clientId = this.tenantContext.getClientId();
 *     if (clientId) {
 *       // Appliquer filtres multi-tenant
 *     }
 *   }
 * }
 * ```
 */
@Injectable()
export class TenantContext {
    private clientId: string | null = null;
    private offerType: string | null = null;

    /**
     * Assigne le client_id actuel du contexte de la requête
     * @param clientId UUID du client, ou null pour mode single-tenant
     */
    setClientId(clientId: string | null): void {
        this.clientId = clientId;
    }

    /**
     * Récupère le client_id actuel du contexte
     * @returns UUID du client, ou null si aucun client défini
     */
    getClientId(): string | null {
        return this.clientId;
    }

    /**
     * Vérifie si un client_id est défini dans le contexte
     * @returns true si un client_id a été assigné, false sinon
     */
    hasClientId(): boolean {
        return this.clientId !== null;
    }

    /**
     * Assigne le type d'offre (plan) du client actuel
     * @param offerType Type d'offre (basic, premium, etc.), ou null
     */
    setOfferType(offerType: string | null): void {
        this.offerType = offerType;
    }

    /**
     * Récupère le type d'offre actuel du contexte
     * @returns Type d'offre, ou null si aucun offerType défini
     */
    getOfferType(): string | null {
        return this.offerType;
    }

    /**
     * Vide le contexte (appeler après la requête)
     */
    clear(): void {
        this.clientId = null;
    }

    /**
     * Génère un nouvel UUID v4 pour client_id
     * Le UUID est utilisé comme identifiant public du client
     * @returns UUID v4
     */
    generateClientId(): string {
        return uuidv4();
    }
}
