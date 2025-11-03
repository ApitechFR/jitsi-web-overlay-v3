# Jitsi Web Overlay v3

## Configuration des variables d'environnement

### À quoi servent les variables et comment sont-elles gérées ?
#### Prosody

Variables principales :
- `PROSODY_DOMAIN` : définit le domaine XMPP utilisé pour les conférences.
- `PROSODY_AVAILABLE_INSTANCES` : liste des instances Prosody disponibles pour la répartition de charge ou la haute disponibilité.
- `PROSODY_ENDPOINT_ROOM` : endpoint pour obtenir la liste des participants d'une salle.
- `PROSODY_ENDPOINT_ROOM_SIZE` : endpoint pour obtenir le nombre de participants dans une salle.
- `PROSODY_ENDPOINT_SESSIONS` : endpoint pour accéder au nombre total de sessions actives.
- `PROSODY_SERVICE_TOKEN` : token d'accès au service Prosody.

##### Endpoints Prosody utilisés

1. **GET /room-size**
	 - **But** : Obtenir le nombre de participants dans une salle (hors focus).
	 - **Paramètres** :
		 - `room` (string, obligatoire) — nom de la salle
		 - `domain` (string, obligatoire) — domaine XMPP (ex: meet.example.com)
		 - `subdomain` (string, optionnel) — sous-domaine multi-tenant
		 - `token` (string, obligatoire si vérification activée) — JWT valide
	 - **Exemple** :
		 ```http
		 GET /room-size?room=demo&domain=meet.example.com&token=<JWT>
		 ```
	 - **Réponse** :
		 ```json
		 {"participants": 2}
		 ```

2. **GET /room**
	 - **But** : Obtenir la liste des participants d’une salle (hors focus).
	 - **Paramètres** :
		 - `room` (string, obligatoire)
		 - `domain` (string, obligatoire)
		 - `subdomain` (string, optionnel)
		 - `token` (string, obligatoire si vérification activée)
	 - **Exemple** :
		 ```http
		 GET /room?room=demo&domain=meet.example.com&token=<JWT>
		 ```
	 - **Réponse** :
		 ```json
		 [
			 {"jid":"user1@conference.meet.example.com/abcd","email":"alice@example.com","display_name":"Alice"},
			 {"jid":"user2@conference.meet.example.com/efgh","email":"bob@example.com","display_name":"Bob"}
		 ]
		 ```

3. **GET /sessions**
	 - **But** : Obtenir le nombre total de sessions actives sur Prosody.
	 - **Paramètres** : Aucun
	 - **Exemple** :
		 ```http
		 GET /sessions
		 ```
	 - **Réponse** :
		 ```json
		 42
		 ```
#### Jitsi
- Jitsi est la plateforme de visioconférence utilisée par l’application.
- Variables principales :
	- `JITSI_JITSIJWT_ISS`, `JITSI_JITSIJWT_AUD`, `JITSI_JITSIJWT_SUB`, `JITSI_JITSIJWT_SECRET`, `JITSI_JITSIJWT_EXPIRESAFTER` : servent à générer et vérifier les tokens JWT pour l’authentification et la sécurisation des conférences.
	- `JITSI_DOMAIN` (frontend) : permet au client de se connecter au bon serveur Jitsi Meet.
- Dans le backend, les variables JWT sont utilisées pour signer les tokens transmis aux clients et valider leur accès aux conférences. Dans le frontend, le domaine Jitsi est utilisé pour initialiser l’iframe ou le composant Jitsi Meet.

Les variables d'environnement permettent de configurer le comportement du backend et du frontend sans modifier le code. Elles sont chargées au démarrage par le backend (NestJS) via la librairie dotenv et par le frontend (Vite) via le système `import.meta.env`.

#### Backend
- Les variables sont accessibles dans le code via `process.env.<NOM>` ou via le service de configuration NestJS (`configService.get('<NOM>')`).
	- `JITSI_JITSIJWT_ISS`, `JITSI_JITSIJWT_SECRET`, etc. sont utilisées pour générer et vérifier les tokens JWT pour Jitsi.
	- `EMAIL_*` configure l'envoi d'emails (SMTP).
	- `AGENTCONNECT_*` configure l'authentification OIDC via AgentConnect.
	- `FRONTCONF_*` permet de définir des contraintes sur les noms de salle (utilisées pour la validation côté backend et frontend).
	- `ENABLE_JIBRI_APITECH_API`, `JIBRI_APITECH_API_DOMAIN` activent et configurent l'intégration avec l'API Jibri Apitech pour l'enregistrement/replay.
	- `NODE_ENV` permet de charger des configurations différentes selon l'environnement (développement, production).

- Exemple :
	- `JITSI_DOMAIN`, `VOXAPI_URL` configurent les services externes utilisés par l'application.
	- `API_URL` permet de pointer vers le backend à utiliser.

- Les variables de sécurité (secrets, tokens) doivent être gardées confidentielles et ne jamais être versionnées.

- Pour changer le comportement, modifiez le fichier `.env` puis redémarrez les services.
- Consultez le code source (backend : `src/config.schema.ts`, frontend : fichiers dans `src/config/` et `vite.config.ts`) pour voir comment chaque variable est utilisée.


### Backend
| Variable | Description | Exemple | Obligatoire | Valeur par défaut |
|----------|-------------|---------|-------------|-------------------|
| PROSODY_API_PREFIX | Préfixe d'API Prosody | `/` | Optionnelle | `/` |
| PROSODY_ENDPOINT_ROOM | Endpoint pour les salles | `/room` | Optionnelle | `/room` |
| PROSODY_ENDPOINT_ROOM_SIZE | Endpoint pour la taille des salles | `/room-size` | Optionnelle | `/room-size` |
| PROSODY_ENDPOINT_SESSIONS | Endpoint pour les sessions | `/sessions` | Optionnelle | `/sessions` |
| PROSODY_SERVICE_TOKEN | Token d'accès au service Prosody Elle est optionnelle, mais doit être renseignée si le serveur Prosody requiert un token d'accès pour les requêtes API. | `token_example` | Optionnelle | (aucune) |
| JITSI_MUC_DOMAIN | Domaine MUC utilisé par Jitsi | `conference.prosody.example.com` | Optionnelle | (aucune) |
| BACKEND_PORT | Port d'écoute du backend | `3030` | Optionnelle | 3030 |
| AGENTCONNECT_PROXYURL | URL du proxy AgentConnect | `https://proxy.example.com` | Optionnelle | (aucune) |
| AGENTCONNECT_CLIENTID | Client ID OIDC | `client_id_example` | Optionnelle | (aucune) |
| AGENTCONNECT_SECRET | Secret OIDC | `secret_example` | Optionnelle | (aucune) |
| AGENTCONNECT_URL | URL du provider OIDC | `https://agentconnect.example.com` | Optionnelle | (aucune) |
| AGENTCONNECT_SCOPE | Scope OIDC | `openid email` | Obligatoire si agent connect oidc connecté | `openid email` |
| AGENTCONNECT_REDIRECT_URL | URL de redirection OIDC | `https://app.example.com/callback` | Optionnelle | (aucune) |
| JITSI_JITSIJWT_ISS | Issuer JWT Jitsi | `issuer_example` | Obligatoire | (aucune) |
| JITSI_JITSIJWT_AUD | Audience JWT Jitsi | `audience_example` | Obligatoire | (aucune) |
| JITSI_JITSIJWT_SUB | Subject JWT Jitsi | `subject_example` | Obligatoire | (aucune) |
| JITSI_JITSIJWT_SECRET | Secret JWT Jitsi | `jwt_secret_example` | Obligatoire | (aucune) |
| JITSI_JITSIJWT_EXPIRESAFTER | Durée de validité du token | `60` | Obligatoire | (aucune) |
| PROSODY_DOMAIN | Domaine Prosody | `prosody.example.com` | Obligatoire | (aucune) |
| PROSODY_AVAILABLE_INSTANCES | Instances Prosody (séparées par un espace) | `prosody1.example.com prosody2.example.com` | Obligatoire | (aucune) |
| JICOFO_AVAILABLE_INSTANCES | Instances Jicofo (séparées par un espace) | `jicofo1.example.com jicofo2.example.com` | Obligatoire | (aucune) |
| MONGO_URI | URI MongoDB | `mongodb://user:pass@host:port/dbname` | Obligatoire si DB_TYPE=mongodb | (aucune) |
| EMAIL_FROM | Adresse email d'envoi | `noreply@example.com` | Optionnelle | (aucune) |
| EMAIL_SUBJECT | Sujet de l'email | `Invitation à la réunion` | Obligatoire | (aucune) |
| EMAIL_SMTP_POOL | Utiliser le pool SMTP | `true` | Optionnelle | `true` |
| EMAIL_SMTP_SECURE | Connexion SMTP sécurisée | `false` | Optionnelle | `false` |
| EMAIL_SMTP_HOST | Hôte SMTP | `smtp.example.com` | Optionnelle | `localhost` |
| EMAIL_SMTP_PORT | Port SMTP | `587` | Optionnelle | `587` |
| EMAIL_SMTP_AUTH_USER | Utilisateur SMTP | `smtp_user` | Optionnelle | (aucune) |
| EMAIL_SMTP_AUTH_PASS | Mot de passe SMTP | `smtp_password` | Optionnelle | (aucune) |
| EMAIL_SMTP_TLS_REJECTUNAUTHORIZED | Rejeter les certificats non autorisés | `false` | Optionnelle | `false` |
| JMMC_URL | URL du service JMMC | `https://jmmc.example.com` | Optionnelle | (aucune) |
| FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS | Nombre min de chiffres dans le nom de salle | `2` | Optionnelle | 3 |
| FRONTCONF_ROOMNAMECONSTRAINT_LENGTH | Longueur du nom de salle | `8` | Optionnelle | 10 |
| COOKIE_SECRET | Secret pour les cookies | `cookie_secret_example` | Obligatoire | (aucune) |
| CORS_ORIGIN | Origine autorisée pour CORS | `https://frontend.example.com` | Optionnelle | (aucune) |
| DB_TYPE | Type de base de données | `mongodb` ou `mariadb` | Obligatoire | (aucune) |
| DB_HOST | Hôte de la base de données | `localhost` | Obligatoire si DB_TYPE=mariadb | (aucune) |
| DB_PORT | Port de la base de données | `3306` | Optionnelle | `3306` |
| DB_USERNAME | Utilisateur DB | `db_user` | Obligatoire si DB_TYPE=mariadb | (aucune) |
| DB_PASSWORD | Mot de passe DB | `db_password` | Obligatoire si DB_TYPE=mariadb | (aucune) |
| DB_NAME | Nom de la base de données | `db_name` | Obligatoire si DB_TYPE=mariadb | (aucune) |
| NODE_ENV | Environnement | `development` ou `production` | Optionnelle | `development` |
| ENABLE_JIBRI_APITECH_API | Active l'API Jibri Apitech | `false` | Optionnelle | (aucune) |
| JIBRI_APITECH_API_DOMAIN | Domaine de l'API Jibri Apitech | `jibri.example.com` | Optionnelle | (aucune) |
| REPLAY_CHECK_TIMEOUT_MS | Timeout pour le check replay | `10000` | Optionnelle | (aucune) |
| FRONTEND_BASE_URL | URL du frontend | `https://frontend.example.com` | Optionnelle | (aucune) |
| FRONTEND_LOGOUT_REDIRECT | URL de redirection logout | `https://frontend.example.com/logout` | Optionnelle | (aucune) |
| JWT_SECRET | Secret JWT | `jwt_secret_example` | Optionnelle | (aucune) |
| OIDC_CLIENTID | Client ID OIDC (alternative) | `client_id_example` | Optionnelle | (aucune) |
| OIDC_SECRET | Secret OIDC (alternative) | `secret_example` | Optionnelle | (aucune) |
| OIDC_SCOPE | Scope OIDC (alternative) | `openid email` | Optionnelle | `openid email profile` |
| OIDC_REDIRECT_URL | URL de redirection OIDC (alternative) | `https://app.example.com/callback` | Optionnelle | (aucune) |
| OIDC_LOGOUT_REDIRECT_URL | URL de logout OIDC | `https://app.example.com/logout` | Optionnelle | (aucune) |
| OIDC_END_SESSION_ENDPOINT | Endpoint end session OIDC | `https://oidc.example.com/end-session` | Optionnelle | (aucune) |
| AUTHORIZATION_ENDPOINT | Endpoint d'autorisation OIDC | `https://oidc.example.com/auth` | Optionnelle | (aucune) |
| TOKEN_ENDPOINT | Endpoint token OIDC | `https://oidc.example.com/token` | Optionnelle | (aucune) |
| USERINFO_ENDPOINT | Endpoint userinfo OIDC | `https://oidc.example.com/userinfo` | Optionnelle | (aucune) |
| COOKIE_DOMAIN | Domaine des cookies | `.example.com` | Optionnelle | (aucune) |
| COOKIE_SAMESITE | SameSite des cookies | `lax` | Optionnelle | (aucune) |
| DEBUG | Active le debug backend | `false` | Optionnelle | false |
| FRONTEND_PORT | Port d'écoute du frontend | `3001` | Optionnelle | 3000 |
| JITSI_DOMAIN  | Domaine Jitsi utilisé côté frontend | `meet.example.com` | Obligatoire | (aucune) |
| VOXAPI_URL | URL de l'API Voxify | `https://voxapi.example.com` | Optionnelle | (aucune) |
| APP_NAME | Nom de l'application | `Jitsi Web Overlay` | Obligatoire | (aucune) |
| APP_ORGANIZATION | Nom de l'organisation | `Organisation` | Obligatoire | (aucune) |
| API_URL | URL de l'API backend | `https://api.example.com` | Obligatoire | (aucune) |
| APP_TEMPLATE | Template d'application joona ou webconf | `joona` | Optionnelle | joona |
| CONFERENCE_NAME_REGEX | Regex pour le nom de conférence | `^.*$` | Optionnelle | (aucune) |
| CONFERENCE_NAME_REGEX_MESSAGE | Message d'erreur regex | `Nom de conférence invalide` | Optionnelle | (aucune) |
| ENABLE_JIBRI_APITECH_API | Active l'API Jibri Apitech | `false` | Optionnelle | false |
| JIBRI_APITECH_API_DOMAIN | Domaine de l'API Jibri Apitech | `jibri.example.com` | Optionnelle | (aucune) |
| REPLAY_CHECK_TIMEOUT_MS | Timeout pour le check replay | `10000` | Optionnelle | 600000 |
| FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS | Nombre min de chiffres dans le nom de salle | `2` | Optionnelle | (aucune) |
| FRONTCONF_ROOMNAMECONSTRAINT_LENGTH | Longueur du nom de salle | `8` | Optionnelle | (aucune) |

## Exemple de fichier `.env`

Voir `.env.sample` pour un exemple complet et prêt à l'emploi.

## Démarrage du projet
Pour lancer l'ensemble du projet (backend, frontend, base de données), utilisez Docker Compose. Ce mode est recommandé pour la cohérence des environnements et la simplicité du démarrage.

### 1. Prérequis
- Docker et Docker Compose installés
- Fichiers `.env` correctement renseignés (voir `.env.sample` et la documentation des variables ci-dessus)

### 2. Préparation des fichiers d'environnement
Copiez les fichiers d'exemple :
```bash
cp example.env .env
cp example.env.development .env.development
```
Adaptez les valeurs à votre environnement (dev, prod, test). Les variables sensibles ne doivent jamais être versionnées.

### 3. Démarrage en développement
Lancez tous les services (backend, frontend, base de données) :
```bash
docker-compose -f docker-compose.dev.yml up --build
```
Les ports exposés par défaut sont :
- Backend : http://localhost:3030
- Frontend : http://localhost:3000
- Base de données MariaDB : localhost:3306

### 4. Démarrage en production
Utilisez le fichier `docker-compose.yml` pour une configuration adaptée à la production :
```bash
docker-compose -f docker-compose.yml up --build -d
```
Adaptez les variables d'environnement et les volumes selon vos besoins.

### 5. Arrêt des services
```bash
docker-compose down
```

### 6. Conseils
- Vérifiez la communication entre les services via les logs Docker (`docker-compose logs`).
- Pour le développement, vous pouvez monter les dossiers en volume pour profiter du hot-reload.
- Pour la production, sécurisez vos secrets et configurez les domaines réels.
- Consultez la documentation des variables pour adapter votre configuration.

---


## Notes

- Les variables marquées "alternative" (OIDC, etc.) ne sont à renseigner que si vous activez le mode ou la fonctionnalité correspondante.
- Les valeurs par défaut indiquées sont celles définies dans le code ou la documentation : vérifiez toujours dans le code source (`src/config.schema.ts`, etc.) pour confirmation.
- Toute variable non listée dans la documentation ou non utilisée dans le code peut être ignorée.
- Les secrets, tokens et mots de passe ne doivent jamais être versionnés ou partagés publiquement.