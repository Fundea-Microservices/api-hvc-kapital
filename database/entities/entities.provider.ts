import { DataSource } from 'typeorm';
import {
  Usuario, Rol, Keys, Menu, Acceso, Config,
  Puesto, Sucursal, Permiso, PermisoRol,
  PermisoUsuario, BitacoraAutorizacion,
} from './index';

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