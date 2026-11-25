/**
 * Centralized entity registry.
 *
 * Single source of truth — import from here in:
 *   - database/data-source.ts  (migrations CLI)
 *   - database/entities/entities.provider.ts  (NestJS DI)
 *   - database/seeds/main.seed.ts  (seed script)
 *
 * When adding a new entity, only add it here.
 */

import { Rol } from './rol.entity';
import { Usuario } from './usuario.entity';
import { Menu } from './menu.entity';
import { Acceso } from './acceso.entity';
import { Keys } from './keys.entity';
import { Config } from './config.entity';
import { ConfigModulo } from './config-modulo.entity';
import { ConfigPolitica } from './config-politica.entity';
import { Puesto } from './puesto.entity';
import { Sucursal } from './sucursal.entity';
import { Permiso } from './permisos/permiso.entity';
import { PermisoRol } from './permisos/permiso-rol.entity';
import { PermisoUsuario } from './permisos/permiso-usuario.entity';
import { BitacoraAutorizacion } from './bitacora-autorizacion.entity';
import { Carousel } from './carousel.entity';
import { TipoUsuario } from './tipo-usuario.entity';
import { Dispositivo } from './dispositivo.entity';
import { SesionApp } from './sesion-app.entity';
import { Dominio } from './dominios/dominio.entity';
import { DominioValor } from './dominios/dominio-valor.entity';
import { DominioRelacion } from './dominios/dominio-relacion.entity';
import { ConfigGeneral } from './configuracion/config-general.entity';
import { BitacoraConfigGeneral } from './configuracion/bitacora-config-general.entity';

export const allEntities = [
  Rol,
  Usuario,
  Menu,
  Acceso,
  Keys,
  Config,
  ConfigModulo,
  ConfigPolitica,
  Puesto,
  Sucursal,
  Permiso,
  PermisoRol,
  PermisoUsuario,
  BitacoraAutorizacion,
  Carousel,
  TipoUsuario,
  Dispositivo,
  SesionApp,
  Dominio,
  DominioValor,
  DominioRelacion,
  ConfigGeneral,
  BitacoraConfigGeneral,
];

// Re-export individual entities for convenience (e.g. seed functions that call ds.getRepository(Rol))
export {
  Rol,
  Usuario,
  Menu,
  Acceso,
  Keys,
  Config,
  ConfigModulo,
  ConfigPolitica,
  Puesto,
  Sucursal,
  Permiso,
  PermisoRol,
  PermisoUsuario,
  BitacoraAutorizacion,
  Carousel,
  TipoUsuario,
  Dispositivo,
  SesionApp,
  Dominio,
  DominioValor,
  DominioRelacion,
  ConfigGeneral,
  BitacoraConfigGeneral,
};
