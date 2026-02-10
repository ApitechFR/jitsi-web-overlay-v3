import * as joi from 'joi';
// env vars validation
export const configValidationSchema = joi.object({
  DB_TYPE: joi.string().valid('mongodb', 'mariadb').required(),
  JMMC_URL: joi.string().uri().optional(),
  COOKIE_SECRET: joi.string().required(),
  //agentConnect
  AGENTCONNECT_CLIENTID: joi.string().optional(),
  AGENTCONNECT_EXPIRESAFTER: joi.number().default(10).optional(),
  AGENTCONNECT_PROXYURL: joi.string().uri().optional(),
  AGENTCONNECT_REDIRECT_URL: joi.string().uri().optional(),
  AGENTCONNECT_SCOPE: joi.string().required().default('openid email'),
  AGENTCONNECT_SECRET: joi.string().optional(),
  AGENTCONNECT_URL: joi.string().uri().optional(),
  //Email
  EMAIL_FROM: joi.string().optional(),
  EMAIL_SMTP_HOST: joi.string().default('localhost').optional(),
  EMAIL_SMTP_POOL: joi.boolean().default(true).optional(),
  EMAIL_SMTP_PORT: joi.number().default(587).optional(),
  EMAIL_SMTP_SECURE: joi.boolean().default(false).optional(),
  EMAIL_SMTP_TLS_REJECTUNAUTHORIZED: joi.boolean().default(false).optional(),
  EMAIL_SUBJECT: joi.string().required(),
  //frontconf
  FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS: joi.number().optional(),
  FRONTCONF_ROOMNAMECONSTRAINT_MINLENGTH: joi.number().optional(),
  FRONTCONF_ROOMNAMECONSTRAINT_MAXLENGTH: joi.number().optional(),
  FRONTCONF_ROOMNAMECONSTRAINT_GENMINLENGTH: joi.number().optional(),
  FRONTCONF_ROOMNAMECONSTRAINT_GENMAXLENGTH: joi.number().optional(),
  //jitsi
  JITSI_JITSIJWT_AUD: joi.string().required(),
  JITSI_JITSIJWT_EXPIRESAFTER: joi.number().required(),
  JITSI_JITSIJWT_ISS: joi.string().required(),
  JITSI_JITSIJWT_SECRET: joi.string().required(),
  JITSI_JITSIJWT_SUB: joi.string().required(),
  //mongodb
  MONGO_URI: joi.when('DB_TYPE', {
    is: 'mongodb',
    then: joi
      .string()
      .uri({ scheme: ['mongodb', 'mongodb+srv'] })
      .required()
      .messages({
        'any.required': 'MONGO_URI is required when DB_TYPE is mongodb',
        'string.uri':
          'MONGO_URI doit commencer par "mongodb://" ou "mongodb+srv://"',
      }),
    otherwise: joi.string().optional().allow('', null),
  }),

  MONGODB_USENEWURLPARSER: joi.boolean().optional(),
  MONGODB_USEUNIFIEDTOPOLOGY: joi.boolean().optional(),

  // MariaDB
  DB_HOST: joi
    .string()
    .when('DB_TYPE', { is: 'mariadb', then: joi.required() }),
  DB_PORT: joi.number().default(3306),
  DB_USERNAME: joi
    .string()
    .when('DB_TYPE', { is: 'mariadb', then: joi.required() }),
  DB_PASSWORD: joi
    .string()
    .when('DB_TYPE', { is: 'mariadb', then: joi.required() }),
  DB_NAME: joi
    .string()
    .when('DB_TYPE', { is: 'mariadb', then: joi.required() }),

  //prosody
  PROSODY_AVAILABLE_INSTANCES: joi.string().optional(),
  PROSODY_DOMAIN: joi.string().optional(),
  //jicofo
  JICOFO_AVAILABLE_INSTANCES: joi.string().optional(),

  //environment
  NODE_ENV: joi
    .string()
    .valid('development', 'production', 'test')
    .default('development'),

  //OIDC
  OIDC_CLIENTID: joi.string().optional(),
  OIDC_REDIRECT_URL: joi.string().uri().optional(),
  OIDC_SCOPE: joi.string().default('openid email profile').optional(),
  OIDC_SECRET: joi.string().allow('').optional(),
  OIDC_URL: joi.string().uri().optional(),
  AUTHORIZATION_ENDPOINT: joi.string().uri().optional(),
  USERINFO_ENDPOINT: joi.string().uri().optional(),
  TOKEN_ENDPOINT: joi.string().uri().optional(),
  OIDC_END_SESSION_ENDPOINT: joi.string().uri().optional(),
  OIDC_LOGOUT_REDIRECT_URL: joi.string().uri().optional(),

  // LDAP
  LDAP_URL: joi.string().uri({ scheme: ['ldap', 'ldaps'] }).optional().messages({
    'string.uri': 'LDAP_URL doit commencer par "ldap://" ou "ldaps://"',
  }),
  LDAP_BIND_DN: joi.string().allow('', null).optional(),
  LDAP_PASSWORD: joi.string().allow('', null).optional(),
  LDAP_BASE_DN: joi.string().allow('', null).optional(),

});
