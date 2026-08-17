import { DataSource } from 'typeorm';
import { Menu } from './menu.entity';
import { Acceso } from './acceso.entity';
import { Config } from './config.entity';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';
import { Keys } from './keys.entity';
import { Puesto } from './puesto.entity';
import { CategoriaInsumo } from './bodega/categoria-insumo.entity';
import { Insumo } from './bodega/insumo.entity';
import { MovimientoInsumo } from './bodega/movimiento-insumo.entity';
import { Sucursal } from './sucursal.entity';
import { Permiso } from './permisos/permiso.entity';
import { PermisoRol } from './permisos/permiso-rol.entity';
import { PermisoUsuario } from './permisos/permiso-usuario.entity';

const entities = [
  { token: 'USUARIO_REPOSITORY', entity: Usuario },
  { token: 'ROL_REPOSITORY', entity: Rol },
  { token: 'KEYS_REPOSITORY', entity: Keys },
  { token: 'MENU_REPOSITORY', entity: Menu },
  { token: 'ACCESO_REPOSITORY', entity: Acceso },
  { token: 'CONFIG_REPOSITORY', entity: Config },
  { token: 'PUESTO_REPOSITORY', entity: Puesto }, 
  { token: 'SUCURSAL_REPOSITORY', entity: Sucursal }, 
  { token: 'CATEGORIA_INSUMO_REPOSITORY', entity: CategoriaInsumo },
  { token: 'INSUMO_REPOSITORY', entity: Insumo },
  { token: 'MOVIMIENTO_INSUMO_REPOSITORY', entity: MovimientoInsumo },
  { token: 'PERMISO_REPOSITORY', entity: Permiso },
  { token: 'PERMISO_ROL_REPOSITORY', entity: PermisoRol },
  { token: 'PERMISO_USUARIO_REPOSITORY', entity: PermisoUsuario },
];

export const EntitiesProvider = entities.map(({ token, entity }) => ({
  provide: token,
  useFactory: (dataSource: DataSource) => dataSource.getRepository(entity),
  inject: ['DATA_SOURCE_SQLSERVER'],
}));