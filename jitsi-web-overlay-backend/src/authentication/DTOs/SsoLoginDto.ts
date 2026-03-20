import { IsString, IsOptional, MinLength } from 'class-validator';

/**
 * DTO pour POST /authentication/sso-login
 * 
 * Reçoit le token JWT RS256 + room + nonce en corps de la requête (pas en URL)
 */
export class SsoLoginDto {
    /**
     * Token JWT RS256 du Provider (Application A)
     * 
     * Exemple:
     * eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWExIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0...
     */
    @IsString()
    @MinLength(100)
    token: string;

    /**
     * Nonce pour anti-replay
     * 
     * Généré par le frontend
     * Utilisable une seule fois
     */
    @IsString()
    @MinLength(16)
    nonce: string;

    /**
     * Nom optionnel de la conférence
     * 
     * Si présent: redirection vers /room/{room}
     * Si absent: redirection vers /
     */
    @IsOptional()
    @IsString()
    @MinLength(3)
    room?: string;
}
