import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  DB_TYPE: 'mssql';
  JWT_SECRET: string;
  TOKEN_EXPIRATION: number;
  PREFIX: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DB_HOST: joi.string().required(),
    DB_PORT: joi.number().required(),
    DB_USER: joi.string().required(),
    DB_PASSWORD: joi.string().allow('').required(),
    DB_DATABASE: joi.string().required(),
    // Solo 'mssql': el proveedor de datos configura opciones específicas de
    // SQL Server (tedious), así que aceptar otros motores aquí daría una
    // falsa sensación de que son intercambiables.
    DB_TYPE: joi.string().valid('mssql').required(),
    JWT_SECRET: joi.string().required(),
    TOKEN_EXPIRATION: joi.number().required(),
    PREFIX: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  // NATS_SERVERS: process.env.NATS_SERVERS ? process.env.NATS_SERVERS.split(',') : [],
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DATABASE: process.env.DB_DATABASE,
  DB_TYPE: process.env.DB_TYPE,
  JWT_SECRET: process.env.JWT_SECRET,
  PREFIX: process.env.PREFIX,
});

if (error) {
  throw new Error(
    `Error en generación de variables de entorno: ${error.message}`,
  );
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  dbServer: envVars.DB_HOST,
  dbPort: envVars.DB_PORT,
  dbUser: envVars.DB_USER,
  dbPassword: envVars.DB_PASSWORD,
  dbDatabase: envVars.DB_DATABASE,
  dbType: envVars.DB_TYPE,
  jwtSecret: envVars.JWT_SECRET,
  tokenExpiration: envVars.TOKEN_EXPIRATION,
  prefix: envVars.PREFIX,
};
