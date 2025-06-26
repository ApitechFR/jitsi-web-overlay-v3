import * as joi from 'joi';
// env vars validation
export const configValidationSchema = joi.object({
  DB_TYPE: joi.string().valid('mongodb', 'mariadb').required(),
  JMMC_URL: joi.string().uri().required(),
  COOKIE_SECRET: joi.string().required(),
  //agentConnect
  AGENTCONNECT_CLIENTID: joi.string().required(),
  AGENTCONNECT_EXPIRESAFTER: joi.number().default(10),
  AGENTCONNECT_PROXYURL: joi.string().uri().required(),
  AGENTCONNECT_REDIRECT_URL: joi.string().uri().required(),
  AGENTCONNECT_SCOPE: joi.string().required().default('openid email'),
  AGENTCONNECT_SECRET: joi.string().required(),
  AGENTCONNECT_URL: joi.string().uri().required(),
  //Email
  EMAIL_FROM: joi.string().required(),
  EMAIL_SMTP_HOST: joi.string().required().default('localhost'),
  EMAIL_SMTP_POOL: joi.boolean().required(),
  EMAIL_SMTP_PORT: joi.number().required(),
  EMAIL_SMTP_SECURE: joi.boolean().required(),
  EMAIL_SMTP_TLS_REJECTUNAUTHORIZED: joi.boolean().required(),
  EMAIL_SUBJECT: joi.string().required(),
  //frontconf
  FRONTCONF_ROOMNAMECONSTRAINT_LENGTH: joi.number().required(),
  FRONTCONF_ROOMNAMECONSTRAINT_MINNUMBEROFDIGITS: joi.number().required(),
  //jitsi
  JITSI_JITSIJWT_AUD: joi.string().required(),
  JITSI_JITSIJWT_EXPIRESAFTER: joi.number().required(),
  JITSI_JITSIJWT_ISS: joi.string().required(),
  JITSI_JITSIJWT_SECRET: joi.string().required(),
  JITSI_JITSIJWT_SUB: joi.string().required(),
  //mongodb
  MONGO_URI: joi.when('DB_TYPE', {
    is: 'mongodb',
    then: joi.string()
      .uri({ scheme: ['mongodb', 'mongodb+srv'] })
      .required()
      .messages({
        'any.required': 'MONGO_URI is required when DB_TYPE is mongodb',
        'string.uri': 'MONGO_URI doit commencer par "mongodb://" ou "mongodb+srv://"',
      }),
    otherwise: joi.string().optional().allow('', null),
  }),

  MONGODB_USENEWURLPARSER: joi.boolean(),
  MONGODB_USEUNIFIEDTOPOLOGY: joi.boolean(),

  // MariaDB
  DB_HOST: joi.string().when('DB_TYPE', { is: 'mariadb', then: joi.required() }),
  DB_PORT: joi.number().default(3306),
  DB_USERNAME: joi.string().when('DB_TYPE', { is: 'mariadb', then: joi.required() }),
  DB_PASSWORD: joi.string().when('DB_TYPE', { is: 'mariadb', then: joi.required() }),
  DB_NAME: joi.string().when('DB_TYPE', { is: 'mariadb', then: joi.required() }),

  //prosody
  PROSODY_AVAILABLE_INSTANCES: joi.string().required(),
  PROSODY_DOMAIN: joi.string().required(),
  //jicofo
  JICOFO_AVAILABLE_INSTANCES: joi.string().required(),

  //environment
  NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
});
