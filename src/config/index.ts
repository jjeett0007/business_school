import Joi from "joi";
import dotenv from "dotenv";

dotenv.config();

const envVarsSchema = Joi.object()
  .keys({
    PORT: Joi.number(),
    PING: Joi.string().optional(),

    MONGODB_USERNAME: Joi.string(),
    MONGODB_PASSWORD: Joi.string(),
    MONGODB_URL: Joi.string(),
    MONGODB_DATABASE: Joi.string(),

    JWT_SECRET: Joi.string(),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number(),
    JWT_REFRESH_EXPIRATION_MINUTES: Joi.number(),

    SMTP_HOST: Joi.string(),
    SMTP_PORT: Joi.number(),
    SMTP_MAIL: Joi.string(),
    SMTP_PASSWORD: Joi.string(),
    EMAIL_FROM: Joi.string(),

    SERVER_ORIGIN: Joi.string(),
    FRONTEND_ORIGIN: Joi.string(),

    OPENAI_API_KEY: Joi.string().required(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  port: envVars.PORT,
  env: envVars.NODE_ENV,

  mongoose: {
    username: envVars.MONGODB_USERNAME,
    password: envVars.MONGODB_PASSWORD,
    url: envVars.MONGODB_URL,
    database: envVars.MONGODB_DATABASE,
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationMinutes: envVars.JWT_REFRESH_EXPIRATION_MINUTES,
  },

  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        username: envVars.SMTP_MAIL,
        password: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },

  ping: {
    url: envVars.PING_URL,
  },

  socket: {
    origin: envVars.SOCKET_ORIGIN,
  },

  protocol: {
    server_origin: envVars.SERVER_ORIGIN,
    frontend_origin: envVars.FRONTEND_ORIGIN,
  },

  openai: {
    apiKey: envVars.OPENAI_API_KEY,
  },
};
