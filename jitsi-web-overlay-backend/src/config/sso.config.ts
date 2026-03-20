/**
 * Configuration pour le SSO (Solution 3 - Hybrid POST)
 * 
 * Cette configuration est chargée par NestJS ConfigModule
 * Accès dans les services via: this.configService.get('sso.allowedOrigins')
 */
const ssoConfig = () => ({
  sso: {
    /**
     * Origins autorisées pour les requêtes SSO
     * Format: Liste d'URL de base (sans path)
     * 
     * Variables d'environnement supportées:
     * - SSO_ALLOWED_ORIGINS: Comma-separated list ou JSON array
     *   Exemples:
     *   SSO_ALLOWED_ORIGINS="https://app-a.com,https://app-a-staging.com"
     *   SSO_ALLOWED_ORIGINS='["https://app-a.com", "https://app-a-staging.com"]'
     */
    allowedOrigins: parseAllowedOrigins(
      process.env.SSO_ALLOWED_ORIGINS,
      'https://app-a.example.com,https://app-a-staging.example.com'
    ),

    /**
     * Durée de vie du nonce (en secondes)
     * Anti-replay: les nonces expirés sont automatiquement nettoyés
     * Valeur par défaut: 600 secondes (10 minutes)
     */
    nonceExpireIn: Number.parseInt(process.env.SSO_NONCE_EXPIRE_IN || '600', 10),

    /**
     * Clé publique RS256 du Provider
     * Utilisée pour valider la signature des tokens JWT
     * 
     * Variables d'environnement supportées:
     * - PROVIDER_JWT_PUBLIC_KEY: Clé PEM directement
     * - PROVIDER_JWT_PUBLIC_KEY_FILE: Chemin vers un fichier de clé
     * - PROVIDER_JWT_JWKS_URL: URL du JWKS endpoint du Provider
     */
    providerPublicKey: process.env.PROVIDER_JWT_PUBLIC_KEY,
    providerPublicKeyFile: process.env.PROVIDER_JWT_PUBLIC_KEY_FILE,
    providerJwksUrl: process.env.PROVIDER_JWT_JWKS_URL,
  },
});

/**
 * Parser pour SSO_ALLOWED_ORIGINS
 * Supporte les formats suivants:
 * 1. CSV: "https://app-a.com,https://app-b.com"
 * 2. JSON Array: '["https://app-a.com", "https://app-b.com"]'
 * 3. Undefined: utilise les valeurs par défaut
 */
function parseAllowedOrigins(
  originsEnv: string | undefined,
  defaultValue: string,
): string[] {
  const value = originsEnv || defaultValue;

  // Essayer de parser comme JSON array d'abord
  if (value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(origin => typeof origin === 'string' && origin.trim().length > 0);
      }
    } catch {
      // Pas du JSON valide, continuer avec CSV
    }
  }

  // Parser comme CSV (comma-separated)
  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

export default ssoConfig;
