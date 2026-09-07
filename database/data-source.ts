/**
 * TypeORM CLI DataSource configuration.
 *
 * Used by:
 *   - `typeorm migration:generate`
 *   - `typeorm migration:run`
 *   - `typeorm migration:revert`
 *   - Seed scripts (main.seed.ts)
 *
 * This file is intentionally standalone — it does NOT import from src/config
 * because the CLI runs outside the NestJS bootstrap context.
 * Credentials are read exclusively from process.env (SAST-compliant).
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';

// ─── Entities ────────────────────────────────────────────────────────────────
import { allEntities } from './entities';

export default new DataSource({
  type: (process.env.DB_TYPE as 'mssql') || 'mssql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 1433,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: allEntities,
  migrations: ['database/migrations/**/*.ts'],
  synchronize: false,
  options: {
    useUTC: true,
    trustServerCertificate: true,
  },
});
