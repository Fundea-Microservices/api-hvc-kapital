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
  AUTH_CODE_SECRET: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_DB: number;
  REDIS_CONNECT_TIMEOUT_MS: number;
  REDIS_COMMAND_TIMEOUT_MS: number;
  IDEMPOTENCY_HEADER: string;
  IDEMPOTENCY_TTL_SECONDS: number;
  IDEMPOTENCY_LOCK_TIMEOUT_MS: number;
  IDEMPOTENCY_WAIT_TIMEOUT_MS: number;
  IDEMPOTENCY_KEY_PREFIX: string;
  IDEMPOTENCY_FAIL_OPEN: boolean;
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
    AUTH_CODE_SECRET: joi.string().min(32).required(),
    // Redis: almacén de la idempotencia (ver docs/IMPLEMENTACION-IDEMPOTENCIA.md).
    // Se dejan con default para no romper entornos existentes; en producción
    // estas variables deben apuntar al Redis instalado por
    // scripts/redis/install-redis.sh.
    REDIS_HOST: joi.string().default('127.0.0.1'),
    REDIS_PORT: joi.number().port().default(6379),
    REDIS_PASSWORD: joi.string().allow('').default(''),
    REDIS_DB: joi.number().integer().min(0).max(15).default(0),
    REDIS_CONNECT_TIMEOUT_MS: joi.number().integer().min(1000).default(5000),
    REDIS_COMMAND_TIMEOUT_MS: joi.number().integer().min(1000).default(10000),
    IDEMPOTENCY_HEADER: joi.string().default('Idempotency-Key'),
    IDEMPOTENCY_TTL_SECONDS: joi.number().integer().min(60).default(86400),
    // lockTimeout es el umbral de "proceso colgado": debe superar al handler
    // más lento (una subida de archivo con antivirus puede tardar).
    IDEMPOTENCY_LOCK_TIMEOUT_MS: joi
      .number()
      .integer()
      .min(1000)
      .default(120000),
    IDEMPOTENCY_WAIT_TIMEOUT_MS: joi
      .number()
      .integer()
      .min(1000)
      .default(180000),
    IDEMPOTENCY_KEY_PREFIX: joi.string().default('idempotency:'),
    // fail-closed: si Redis no responde, la mutación se rechaza en vez de
    // ejecutarse sin protección. fail-open prioriza disponibilidad.
    IDEMPOTENCY_FAIL_OPEN: joi.boolean().default(false),
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
  AUTH_CODE_SECRET: process.env.AUTH_CODE_SECRET,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB: process.env.REDIS_DB,
  REDIS_CONNECT_TIMEOUT_MS: process.env.REDIS_CONNECT_TIMEOUT_MS,
  REDIS_COMMAND_TIMEOUT_MS: process.env.REDIS_COMMAND_TIMEOUT_MS,
  IDEMPOTENCY_HEADER: process.env.IDEMPOTENCY_HEADER,
  IDEMPOTENCY_TTL_SECONDS: process.env.IDEMPOTENCY_TTL_SECONDS,
  IDEMPOTENCY_LOCK_TIMEOUT_MS: process.env.IDEMPOTENCY_LOCK_TIMEOUT_MS,
  IDEMPOTENCY_WAIT_TIMEOUT_MS: process.env.IDEMPOTENCY_WAIT_TIMEOUT_MS,
  IDEMPOTENCY_KEY_PREFIX: process.env.IDEMPOTENCY_KEY_PREFIX,
  IDEMPOTENCY_FAIL_OPEN: process.env.IDEMPOTENCY_FAIL_OPEN,
}) as { error?: { message: string }; value: EnvVars };

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
  authCodeSecret: envVars.AUTH_CODE_SECRET,
  redisHost: envVars.REDIS_HOST,
  redisPort: envVars.REDIS_PORT,
  redisPassword: envVars.REDIS_PASSWORD,
  redisDb: envVars.REDIS_DB,
  redisConnectTimeoutMs: envVars.REDIS_CONNECT_TIMEOUT_MS,
  redisCommandTimeoutMs: envVars.REDIS_COMMAND_TIMEOUT_MS,
  idempotencyHeader: envVars.IDEMPOTENCY_HEADER,
  idempotencyTtlSeconds: envVars.IDEMPOTENCY_TTL_SECONDS,
  idempotencyLockTimeoutMs: envVars.IDEMPOTENCY_LOCK_TIMEOUT_MS,
  idempotencyWaitTimeoutMs: envVars.IDEMPOTENCY_WAIT_TIMEOUT_MS,
  idempotencyKeyPrefix: envVars.IDEMPOTENCY_KEY_PREFIX,
  idempotencyFailOpen: envVars.IDEMPOTENCY_FAIL_OPEN,
};
