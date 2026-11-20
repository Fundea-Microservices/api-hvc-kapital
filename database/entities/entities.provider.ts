import { DataSource } from 'typeorm';
import {
  Usuario, Rol, Keys, Menu, Acceso, Config,
  ConfigModulo, ConfigPolitica,
  Puesto, Sucursal, Permiso, PermisoRol,
  PermisoUsuario, BitacoraAutorizacion, Carousel, TipoUsuario,
  Dispositivo, SesionApp,
  CatalogoTipo, CatalogoItem, CatalogoRelacion,
} from './index';

const entities = [
  { token: 'USUARIO_REPOSITORY', entity: Usuario },
  { token: 'ROL_REPOSITORY', entity: Rol },
  { token: 'KEYS_REPOSITORY', entity: Keys },
  { token: 'MENU_REPOSITORY', entity: Menu },
  { token: 'ACCESO_REPOSITORY', entity: Acceso },
  { token: 'CONFIG_REPOSITORY', entity: Config },
  { token: 'CONFIG_MODULO_REPOSITORY', entity: ConfigModulo },
  { token: 'CONFIG_POLITICA_REPOSITORY', entity: ConfigPolitica },
  { token: 'PUESTO_REPOSITORY', entity: Puesto },
  { token: 'SUCURSAL_REPOSITORY', entity: Sucursal },
  { token: 'PERMISO_REPOSITORY', entity: Permiso },
  { token: 'PERMISO_ROL_REPOSITORY', entity: PermisoRol },
  { token: 'PERMISO_USUARIO_REPOSITORY', entity: PermisoUsuario },
  { token: 'BITACORA_AUTORIZACION_REPOSITORY', entity: BitacoraAutorizacion },
  { token: 'CAROUSEL_REPOSITORY', entity: Carousel },
  { token: 'TIPO_USUARIO_REPOSITORY', entity: TipoUsuario },
  { token: 'DISPOSITIVO_REPOSITORY', entity: Dispositivo },
  { token: 'SESION_APP_REPOSITORY', entity: SesionApp },
  { token: 'CATALOGO_TIPO_REPOSITORY', entity: CatalogoTipo },
  { token: 'CATALOGO_ITEM_REPOSITORY', entity: CatalogoItem },
  { token: 'CATALOGO_RELACION_REPOSITORY', entity: CatalogoRelacion },
];

export const EntitiesProvider = entities.map(({ token, entity }) => ({
  provide: token,
  useFactory: (dataSource: DataSource) => dataSource.getRepository(entity),
  inject: ['DATA_SOURCE_SQLSERVER'],
}));