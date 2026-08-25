import { DataSource } from 'typeorm';
import { Menu } from './menu.entity';
import { Acceso } from './acceso.entity';
import { Config } from './config.entity';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';
import { Keys } from './keys.entity';
import { Puesto } from './puesto.entity';
import { Sucursal } from './sucursal.entity';
import { Permiso } from './permisos/permiso.entity';
import { PermisoRol } from './permisos/permiso-rol.entity';
import { PermisoUsuario } from './permisos/permiso-usuario.entity';
import { BitacoraAutorizacion } from './bitacora-autorizacion.entity';

const entities = [
  { token: 'USUARIO_REPOSITORY', entity: Usuario },
  { token: 'ROL_REPOSITORY', entity: Rol },
  { token: 'KEYS_REPOSITORY', entity: Keys },
  { token: 'MENU_REPOSITORY', entity: Menu },
  { token: 'ACCESO_REPOSITORY', entity: Acceso },
  { token: 'CONFIG_REPOSITORY', entity: Config },
  { token: 'PUESTO_REPOSITORY', entity: Puesto }, 
  { token: 'SUCURSAL_REPOSITORY', entity: Sucursal }, 
  { token: 'PERMISO_REPOSITORY', entity: Permiso },
  { token: 'PERMISO_ROL_REPOSITORY', entity: PermisoRol },
  { token: 'PERMISO_USUARIO_REPOSITORY', entity: PermisoUsuario },
  { token: 'BITACORA_AUTORIZACION_REPOSITORY', entity: BitacoraAutorizacion },
];

export const EntitiesProvider = entities.map(({ token, entity }) => ({
  provide: token,
  useFactory: (dataSource: DataSource) => dataSource.getRepository(entity),
  inject: ['DATA_SOURCE_SQLSERVER'],
}));