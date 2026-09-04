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
import { Rol } from './entities/rol.entity';
import { Usuario } from './entities/usuario.entity';
import { Menu } from './entities/menu.entity';
import { Acceso } from './entities/acceso.entity';
import { Keys } from './entities/keys.entity';
import { Config } from './entities/config.entity';
import { Puesto } from './entities/puesto.entity';
import { Sucursal } from './entities/sucursal.entity';
import { Permiso } from './entities/permisos/permiso.entity';
import { PermisoRol } from './entities/permisos/permiso-rol.entity';
import { PermisoUsuario } from './entities/permisos/permiso-usuario.entity';
import { BitacoraAutorizacion } from './entities/bitacora-autorizacion.entity';

const entities = [
  Rol,
  Usuario,
  Menu,
  Acceso,
  Keys,
  Config,
  Puesto,
  Sucursal,
  Permiso,
  PermisoRol,
  PermisoUsuario,
  BitacoraAutorizacion,
];

export default new DataSource({
  type: (process.env.DB_TYPE as 'mssql') || 'mssql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 1433,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities,
  migrations: ['database/migrations/**/*.ts'],
  synchronize: false,
  options: {
    useUTC: true,
    trustServerCertificate: true,
  },
});
