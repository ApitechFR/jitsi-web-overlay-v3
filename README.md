# Jitsi Web Overlay v3

## Configuration des variables d'environnement

### À quoi servent les variables et comment sont-elles gérées ?
#### Prosody
- Prosody est le serveur XMPP utilisé pour la gestion des conférences Jitsi.
- Variables principales :
	- `PROSODY_DOMAIN` : définit le domaine XMPP utilisé pour les conférences.
	- `PROSODY_AVAILABLE_INSTANCES` : liste des instances Prosody disponibles pour la répartition de charge ou la haute disponibilité.
- Dans le code, ces variables sont utilisées pour générer les URLs de conférence, configurer la communication entre les services et sélectionner dynamiquement l’instance Prosody à utiliser.

#### Jitsi
- Jitsi est la plateforme de visioconférence utilisée par l’application.
- Variables principales :
	- `JITSI_JITSIJWT_ISS`, `JITSI_JITSIJWT_AUD`, `JITSI_JITSIJWT_SUB`, `JITSI_JITSIJWT_SECRET`, `JITSI_JITSIJWT_EXPIRESAFTER` : servent à générer et vérifier les tokens JWT pour l’authentification et la sécurisation des conférences.
	- `JITSI_DOMAIN` (frontend) : permet au client de se connecter au bon serveur Jitsi Meet.
- Dans le backend, les variables JWT sont utilisées pour signer les tokens transmis aux clients et valider leur accès aux conférences. Dans le frontend, le domaine Jitsi est utilisé pour initialiser l’iframe ou le composant Jitsi Meet.

Les variables d'environnement permettent de configurer le comportement du backend et du frontend sans modifier le code. Elles sont chargées au démarrage par le backend (NestJS) via la librairie dotenv et par le frontend (Vite) via le système `import.meta.env`.

#### Backend
- Les variables sont accessibles dans le code via `process.env.<NOM>` ou via le service de configuration NestJS (`configService.get('<NOM>')`).
- Exemple :
	- `DB_TYPE`, `MONGO_URI`, `DB_HOST`, etc. déterminent le type et les paramètres de la base de données utilisée.
	- `JITSI_JITSIJWT_ISS`, `JITSI_JITSIJWT_SECRET`, etc. sont utilisées pour générer et vérifier les tokens JWT pour Jitsi.
	- `EMAIL_*` configure l'envoi d'emails (SMTP).
	- `AGENTCONNECT_*` configure l'authentification OIDC via AgentConnect.
	- `FRONTCONF_*` permet de définir des contraintes sur les noms de salle (utilisées pour la validation côté backend et frontend).
	- `ENABLE_JIBRI_APITECH_API`, `JIBRI_APITECH_API_DOMAIN` activent et configurent l'intégration avec l'API Jibri Apitech pour l'enregistrement/replay.
	- `NODE_ENV` permet de charger des configurations différentes selon l'environnement (développement, production).

#### Frontend
- Les variables sont injectées au build et accessibles via `import.meta.env.<NOM>`.
- Exemple :
	- `JITSI_DOMAIN`, `VOXAPI_URL` configurent les services externes utilisés par l'application.
	- `APP_NAME`, `APP_ORGANIZATION` personnalisent l'affichage et le branding.
	- `CONFERENCE_NAME_REGEX`, `CONFERENCE_NAME_REGEX_MESSAGE` servent à valider les noms de conférence côté client.
	- `DEBUG` active le mode debug pour afficher des logs supplémentaires.
	- `API_URL` permet de pointer vers le backend à utiliser.

#### Gestion et priorités
- Si une variable n'est pas définie, le code utilise généralement une valeur par défaut ou lève une erreur explicite.
- Certaines variables sont optionnelles et n'activent des fonctionnalités que si elles sont renseignées (ex : Jibri, AgentConnect).
- Les variables de sécurité (secrets, tokens) doivent être gardées confidentielles et ne jamais être versionnées.

#### Bonnes pratiques
- Toujours adapter les valeurs à votre environnement (dev, prod, test).
- Pour changer le comportement, modifiez le fichier `.env` puis redémarrez les services.
- Consultez le code source (backend : `src/config.schema.ts`, frontend : fichiers dans `src/config/` et `vite.config.ts`) pour voir comment chaque variable est utilisée.

Ce projet utilise un fichier `.env` pour la configuration. Voici la liste des variables supportées, leur usage et des exemples :

### Backend
| Variable | Description | Exemple |
|----------|-------------|---------|
| BACKEND_PORT | Port d'écoute du backend | `3030` |
| AGENTCONNECT_PROXYURL | URL du proxy AgentConnect | `https://proxy.example.com` |
| AGENTCONNECT_CLIENTID | Client ID OIDC | `client_id_example` |
| AGENTCONNECT_SECRET | Secret OIDC | `secret_example` |
| AGENTCONNECT_URL | URL du provider OIDC | `https://agentconnect.example.com` |
| AGENTCONNECT_SCOPE | Scope OIDC | `openid email` |
| AGENTCONNECT_REDIRECT_URL | URL de redirection OIDC | `https://app.example.com/callback` |
| JITSI_JITSIJWT_ISS | Issuer JWT Jitsi | `issuer_example` |
| JITSI_JITSIJWT_AUD | Audience JWT Jitsi | `audience_example` |
| JITSI_JITSIJWT_SUB | Subject JWT Jitsi | `subject_example` |
| JITSI_JITSIJWT_SECRET | Secret JWT Jitsi | `jwt_secret_example` |
| JITSI_JITSIJWT_EXPIRESAFTER | Durée de validité du token | `60` |
| PROSODY_DOMAIN | Domaine Prosody | `prosody.example.com` |
| PROSODY_AVAILABLE_INSTANCES | Instances Prosody (séparées par un espace) | `prosody1.example.com prosody2.example.com` |
| JICOFO_AVAILABLE_INSTANCES | Instances Jicofo (séparées par un espace) | `jicofo1.example.com jicofo2.example.com` |
| MONGO_URI | URI MongoDB | `mongodb://user:pass@host:port/dbname` |
| EMAIL_FROM | Adresse email d'envoi | `noreply@example.com` |
| EMAIL_SUBJECT | Sujet de l'email | `Invitation à la réunion` |
| EMAIL_SMTP_POOL | Utiliser le pool SMTP | `true` |
| EMAIL_SMTP_SECURE | Connexion SMTP sécurisée | `false` |
| EMAIL_SMTP_HOST | Hôte SMTP | `smtp.example.com` |
| EMAIL_SMTP_PORT | Port SMTP | `587` |
| EMAIL_SMTP_AUTH_USER | Utilisateur SMTP | `smtp_user` |
| EMAIL_SMTP_AUTH_PASS | Mot de passe SMTP | `smtp_password` |
| EMAIL_SMTP_TLS_REJECTUNAUTHORIZED | Rejeter les certificats non autorisés | `false` |
| JMMC_URL | URL du service JMMC | `https://jmmc.example.com` |
| FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS | Nombre min de chiffres dans le nom de salle | `2` |
| FRONTCONF_ROOMNAMECONSTRAINT_LENGTH | Longueur du nom de salle | `8` |
| COOKIE_SECRET | Secret pour les cookies | `cookie_secret_example` |
| CORS_ORIGIN | Origine autorisée pour CORS | `https://frontend.example.com` |
| DB_TYPE | Type de base de données | `mongodb` ou `mariadb` |
| DB_HOST | Hôte de la base de données | `localhost` |
| DB_PORT | Port de la base de données | `3306` |
| DB_USERNAME | Utilisateur DB | `db_user` |
| DB_PASSWORD | Mot de passe DB | `db_password` |
| DB_NAME | Nom de la base de données | `db_name` |
| NODE_ENV | Environnement | `development` ou `production` |
| ENABLE_JIBRI_APITECH_API | Active l'API Jibri Apitech | `false` |
| JIBRI_APITECH_API_DOMAIN | Domaine de l'API Jibri Apitech | `jibri.example.com` |
| REPLAY_CHECK_TIMEOUT_MS | Timeout pour le check replay | `10000` |
| FRONTEND_BASE_URL | URL du frontend | `https://frontend.example.com` |
| FRONTEND_LOGOUT_REDIRECT | URL de redirection logout | `https://frontend.example.com/logout` |
| JWT_SECRET | Secret JWT | `jwt_secret_example` |
| OIDC_CLIENTID | Client ID OIDC (alternative) | `client_id_example` |
| OIDC_SECRET | Secret OIDC (alternative) | `secret_example` |
| OIDC_SCOPE | Scope OIDC (alternative) | `openid email` |
| OIDC_REDIRECT_URL | URL de redirection OIDC (alternative) | `https://app.example.com/callback` |
| OIDC_LOGOUT_REDIRECT_URL | URL de logout OIDC | `https://app.example.com/logout` |
| OIDC_END_SESSION_ENDPOINT | Endpoint end session OIDC | `https://oidc.example.com/end-session` |
| AUTHORIZATION_ENDPOINT | Endpoint d'autorisation OIDC | `https://oidc.example.com/auth` |
| TOKEN_ENDPOINT | Endpoint token OIDC | `https://oidc.example.com/token` |
| USERINFO_ENDPOINT | Endpoint userinfo OIDC | `https://oidc.example.com/userinfo` |
| COOKIE_DOMAIN | Domaine des cookies | `.example.com` |
| COOKIE_SAMESITE | SameSite des cookies | `lax` |

### Frontend
| Variable | Description | Exemple |
|----------|-------------|---------|
| JITSI_DOMAIN | Domaine Jitsi utilisé côté frontend | `meet.example.com` |
| VOXAPI_URL | URL de l'API Vox | `https://voxapi.example.com` |
| APP_NAME | Nom de l'application | `Jitsi Web Overlay` |
| APP_ORGANIZATION | Nom de l'organisation | `Organisation` |
| DEBUG | Active le debug frontend | `false` |
| API_URL | URL de l'API backend | `https://api.example.com` |
| APP_TEMPLATE | Template d'application | `joona` |
| CONFERENCE_NAME_REGEX | Regex pour le nom de conférence | `^.*$` |
| CONFERENCE_NAME_REGEX_MESSAGE | Message d'erreur regex | `Nom de conférence invalide` |
| ENABLE_JIBRI_APITECH_API | Active l'API Jibri Apitech | `false` |
| JIBRI_APITECH_API_DOMAIN | Domaine de l'API Jibri Apitech | `jibri.example.com` |
| REPLAY_CHECK_TIMEOUT_MS | Timeout pour le check replay | `10000` |
| FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS | Nombre min de chiffres dans le nom de salle | `2` |
| FRONTCONF_ROOMNAMECONSTRAINT_LENGTH | Longueur du nom de salle | `8` |

## Exemple de fichier `.env`

Voir `.env.sample` pour un exemple complet et prêt à l'emploi.

## Démarrage du projet

1. Copier le fichier `.env.sample` en `.env` et adapter les valeurs.
2. Installer les dépendances :
	```bash
	npm install
	```
3. Lancer le backend :
	```bash
	npm run start:backend
	```
4. Lancer le frontend :
	```bash
	npm run start:frontend
	```

## Notes
- Les variables marquées "alternative" sont utilisées dans certains cas spécifiques (OIDC, etc.).
- Les valeurs par défaut sont données à titre d'exemple, adaptez-les à votre environnement.