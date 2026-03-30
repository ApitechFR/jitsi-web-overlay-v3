/**
 * DTO retourné lors de la génération de la clé
 *  La clé en texte brut est retournée UNE SEULE FOIS
 */
export class ApiKeyResponseDto {
    id: number;
    apiKey: string; //  Clé en texte brut - À conserver en sécurité!
    createdAt: Date;
    message: string; // " Conservez cette clé en sécurité..."
}
