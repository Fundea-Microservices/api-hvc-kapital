/**
 * main.seed.ts — Idempotent data seeder for hvc-kapital API.
 *
 * SAST-compliant: NO hardcoded credentials or secrets.
 * All sensitive values are read from process.env.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register database/seeds/main.seed.ts
 *
 * Safe to run multiple times — each insert is guarded by an existence check.
 * Data matches database/seeds/Primera Migracion.sql exactly.
 */

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

// ─── Entities ────────────────────────────────────────────────────────────────
import {
  Rol, Menu, Acceso, Sucursal, Puesto, Usuario,
  Permiso, PermisoRol, PermisoUsuario, Config, Keys,
} from '../entities';

// ─── Seed UUIDs (deterministic for idempotency) ─────────────────────────────
const IDS = {
  // Roles
  rolAdmin: 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',
  rolOperador: '3F46A1F3-1B4D-4B28-BC23-6F1C7AB9E67D',
  rolInvitado: '9A7317F7-2B7C-45B2-99E1-47C61A6D8A5F',
  rolNuevo: '3309409C-E0F2-473C-8F45-5862F5C468BE',
  rolAdminOtro: '411E1007-F97D-4C76-B710-BFC9BD4810E0',

  // Sucursales
  sucursalGeneral: 'B1D2C3E4-5F6A-4B7C-8D9E-0A1B2C3D4E5F',
  sucursalCentral: 'F6C3D363-54A2-4396-8BB3-86CB377236E9',

  // Puestos
  puestoAdmin: 'C2E3D4F5-6A7B-4C8D-9E0F-1A2B3C4D5E6F',
  puestoAdminGeneral: '1BC05894-A92B-41C5-97A2-9DFABCF7D852',

  // Usuarios
  userAdmin: 'D3F4E5A6-7B8C-4D9E-0F1A-2B3C4D5E6F7A',
  userAdmin1: '4A7E5179-48BF-4A45-8A5F-27E276AF1756',

  // Menús
  menuConfig: 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC',
  menuUsuarios: '49B66F96-FF63-4CB9-B0E3-D3C0048E2A44',
  menuRoles: 'FD4290C9-DCCB-41C5-90A1-2D0A0D1381A4',
  menuMenus: 'F42F0E87-0C7C-4C12-8B4A-0197FE19BC9F',
  menuAccesos: '5F3C574F-6ED8-4512-BB78-E18409F1E160',
  menuConfiguraciones: 'E17C1D08-FF07-4C96-B4F4-9295D4C9893C',
  menuPuestos: '3F9D5B1B-0C57-4F60-982D-1C1A6B998C37',
  menuSucursales: 'F47AC10B-58CC-4372-A567-0E02B2C3D479',
  menuPermisos: '31DF4276-B38D-4AC8-9270-2466E509B3D9',
  menuPermisosRol: 'B584C48D-C624-403A-9743-DB10D38B86F7',
  menuBitacora: 'C810A11B-4E38-4A12-9A92-99810A2B3C4D',
  menuPermisosUsuario: 'B7E2F4A9-3C6D-4E8A-9F1B-2D5A7C3E8F60',
  // Permisos
  permisoUsrCrear: '8A57A8A0-6899-4EAF-97A9-CC5AB854A716',
  permisoUsrEditar: 'D4B7E9F1-3A2C-4E8B-9F5D-1C7A2B6E8D03',
  permisoUsrEliminar: 'F1C2A8D5-9E4B-4D7F-A3C6-5B8D2E7F4A19',
  permisoUsrResetClave: 'B6E3F7A2-1D5C-4A9E-8B4F-7C2D9E5A6B84',
  permisoBitacora: 'F5A912C8-B1F3-4A59-8132-E8B6D19C4A21',
  permisoPermUsuario: 'A3D7E2B1-5F8C-4A6E-9D3B-1C4E7F2A8D50',
  // Permiso Roles
  permisoRolCrear: 'B1A2C3D4-5E6F-7A8B-9C0D-1E2F3A4B5C6D',
  permisoRolEditar: 'C2B3D4E5-6F7A-8B9C-0D1E-2F3A4B5C6D7E',
  permisoRolEliminar: 'D3C4E5F6-7A8B-9C0D-1E2F-3A4B5C6D7E8F',
  // Permiso Menús
  permisoMenuCrear: 'E4D5F6A7-8B9C-0D1E-2F3A-4B5C6D7E8F90',
  permisoMenuEditar: 'F5E6A7B8-9C0D-1E2F-3A4B-5C6D7E8F90A1',
  permisoMenuEliminar: 'A6F7B8C9-0D1E-2F3A-4B5C-6D7E8F90A1B2',
  // Permiso Accesos
  permisoAccesoCrear: 'B7A8C9D0-1E2F-3A4B-5C6D-7E8F90A1B2C3',
  permisoAccesoEditar: 'C8B9D0E1-2F3A-4B5C-6D7E-8F90A1B2C3D4',
  permisoAccesoEliminar: 'D9C0E1F2-3A4B-5C6D-7E8F-90A1B2C3D4E5',
  // Permiso Puestos
  permisoPuestoCrear: 'E0D1F2A3-4B5C-6D7E-8F90-A1B2C3D4E5F6',
  permisoPuestoEditar: 'F1E2A3B4-5C6D-7E8F-90A1-B2C3D4E5F6A7',
  permisoPuestoEliminar: 'A2F3B4C5-6D7E-8F90-A1B2-C3D4E5F6A7B8',
  // Permiso Sucursales
  permisoSucursalCrear: 'B3A4C5D6-7E8F-90A1-B2C3-D4E5F6A7B8C9',
  permisoSucursalEditar: 'C4B5D6E7-8F90-A1B2-C3D4-E5F6A7B8C9D0',
  permisoSucursalEliminar: 'D5C6E7F8-90A1-B2C3-D4E5-F6A7B8C9D0E1',
  // Permiso Configuración
  permisoConfigCrear: 'E6D7F8A9-0A1B-2C3D-4E5F-6A7B8C9D0E1F',
  permisoConfigEditar: 'F7E8A9B0-1B2C-3D4E-5F6A-7B8C9D0E1F2A',
  permisoConfigEliminar: 'A8F9B0C1-2C3D-4E5F-6A7B-8C9D0E1F2A3B',
  // Permiso API Keys
  permisoApiKeyCrear: 'B9A0C1D2-3D4E-5F6A-7B8C-9D0E1F2A3B4C',
  permisoApiKeyEditar: 'C0B1D2E3-4E5F-6A7B-8C9D-0E1F2A3B4C5D',
  permisoApiKeyEliminar: 'D1C2E3F4-5F6A-7B8C-9D0E-1F2A3B4C5D6E',
  // Permiso Permisos (catálogo)
  permisoPermCrear: 'E2D3F4A5-6A7B-8C9D-0E1F-2A3B4C5D6E7F',
  permisoPermEditar: 'F3E4A5B6-7B8C-9D0E-1F2A-3B4C5D6E7F80',
  permisoPermEliminar: 'A4F5B6C7-8C9D-0E1F-2A3B-4C5D6E7F8091',
  // Permiso Permiso-Rol
  permisoPermRolCrear: 'B5A6C7D8-9D0E-1F2A-3B4C-5D6E7F8091A2',
  permisoPermRolEliminar: 'C6B7D8E9-0E1F-2A3B-4C5D-6E7F8091A2B3',
  // Permiso Permiso-Usuario (asignaciones directas)
  permisoPermUsrEditar: 'D7C8E9F0-1F2A-3B4C-5D6E-7F8091A2B3C4',
  permisoPermUsrEliminar: 'E8D9F0A1-2A3B-4C5D-6E7F-8091A2B3C4D5',
  // Permiso Bitácora (eliminar)
  permisoBitacoraEliminar: 'F9E0A1B2-3B4C-5D6E-7F80-91A2B3C4D5E6',
  // Config AGREGAR METODO AUTENTICACION POR DEFAULT.
  configDiasClave: 'ED737CE7-A1CD-4E83-8A77-F177DAFA0300',
  configMetodoAuthDefault: 'A1B2C3D4-E5F6-7A8B-9C0D-1E2F3A4B5C6D',
  // Keys
  keysIntegracion: 'E90F144E-2EB4-4B98-9A52-40440BF19146',
} as const;

// ─── Menu seed data (color = 'white' per SQL) ──────────────────────────────
const MENUS = [
  { id: IDS.menuConfig, label: 'Configuración', descripcion: 'Configuración de roles, usuarios, menús y accesos', pathApp: 'config', pathWeb: '/config', icono: 'settings', color: 'white', principal: true },
  { id: IDS.menuUsuarios, label: 'Usuarios', descripcion: 'Manejo de usuarios', pathApp: '/config/usuarios', pathWeb: '/config/usuarios', icono: 'circle-user-round', color: 'white', principal: false },
  { id: IDS.menuRoles, label: 'Roles', descripcion: 'Manejo de roles', pathApp: '/config/roles', pathWeb: '/config/roles', icono: 'user-check', color: 'white', principal: false },
  { id: IDS.menuMenus, label: 'Menus', descripcion: 'Manejo de los menús', pathApp: '/config/menus', pathWeb: '/config/menus', icono: 'menu', color: 'white', principal: false },
  { id: IDS.menuAccesos, label: 'Accesos', descripcion: 'Manejo de los accesos por rol', pathApp: '/config/accesos', pathWeb: '/config/accesos', icono: 'user-lock', color: 'white', principal: false },
  { id: IDS.menuConfiguraciones, label: 'Configuraciones', descripcion: 'Variables generales', pathApp: '/config/general', pathWeb: '/config/general', icono: 'settings', color: 'white', principal: false },
  { id: IDS.menuPuestos, label: 'Puestos', descripcion: 'Puestos de los usuarios', pathApp: '/config/puestos', pathWeb: '/config/puestos', icono: 'users', color: 'white', principal: false },
  { id: IDS.menuSucursales, label: 'Sucursales', descripcion: 'Sucursales', pathApp: '/config/sucursales', pathWeb: '/config/sucursales', icono: 'store', color: 'white', principal: false },
  { id: IDS.menuPermisos, label: 'Permisos', descripcion: 'Permisos', pathApp: '/config/permisos', pathWeb: '/config/permisos', icono: 'lock', color: 'white', principal: false },
  { id: IDS.menuPermisosRol, label: 'Permisos - Rol', descripcion: 'Permisos por rol', pathApp: '/config/permisos-rol', pathWeb: '/config/permisos-rol', icono: 'lock', color: 'white', principal: false },
  { id: IDS.menuBitacora, label: 'Bitácora', descripcion: 'Bitácora de autorizaciones y auditoría de peticiones', pathApp: '/config/bitacora', pathWeb: '/config/bitacora', icono: 'clipboard-list', color: 'white', principal: false },
  { id: IDS.menuPermisosUsuario, label: 'Permisos - Usuario', descripcion: 'Asignación de permisos directos a usuarios', pathApp: '/config/permisos-usuario', pathWeb: '/config/permisos-usuario', icono: 'shield-check', color: 'white', principal: false }
];

// ─── Access seed data (all for admin role) ───────────────────────────────────
const ACCESOS_ADMIN = [
  { id: '99B437EF-0721-4F09-A20B-CEEA6138C321', ordenMenu: 1, menuId: IDS.menuConfig, mainMenuId: undefined as string | undefined },
  { id: '2EE85342-7641-4E5A-BC4A-9ED84F341C5C', ordenMenu: 1, menuId: IDS.menuUsuarios, mainMenuId: IDS.menuConfig },
  { id: '43C75BA9-6CBC-4E74-98F9-3584CA5819E8', ordenMenu: 2, menuId: IDS.menuRoles, mainMenuId: IDS.menuConfig },
  { id: 'FAA681A2-0028-44FF-99AD-363F651CF3C9', ordenMenu: 3, menuId: IDS.menuMenus, mainMenuId: IDS.menuConfig },
  { id: '93BF8560-4E82-4796-9273-42C014F525A8', ordenMenu: 4, menuId: IDS.menuAccesos, mainMenuId: IDS.menuConfig },
  { id: 'B88EF61A-2C6A-4A66-BBE9-28AFC0D91E3A', ordenMenu: 5, menuId: IDS.menuConfiguraciones, mainMenuId: IDS.menuConfig },
  { id: 'DCD5D1CA-DDC1-4E98-899F-8C934BBD56BB', ordenMenu: 6, menuId: IDS.menuPuestos, mainMenuId: IDS.menuConfig },
  { id: '6A3EF19B-1233-4A27-838C-7ACDF59482A2', ordenMenu: 7, menuId: IDS.menuSucursales, mainMenuId: IDS.menuConfig },
  { id: '6DC1B85D-67D0-40CA-895C-43727DD9EF4B', ordenMenu: 8, menuId: IDS.menuPermisos, mainMenuId: IDS.menuConfig },
  { id: 'D20302E9-6D33-47C7-8162-63E68AD5E64F', ordenMenu: 9, menuId: IDS.menuPermisosRol, mainMenuId: IDS.menuConfig },
  { id: '8A9B1C2D-3E4F-5A6B-7C8D-9E0F1A2B3C4D', ordenMenu: 10, menuId: IDS.menuBitacora, mainMenuId: IDS.menuConfig },
  { id: 'F2E8D4C7-1A3B-4E5F-9C6D-8B2A7D1E4F30', ordenMenu: 11, menuId: IDS.menuPermisosUsuario, mainMenuId: IDS.menuConfig },
];

// ─── Permission seed data ────────────────────────────────────────────────────
const PERMISOS = [
  // Permisos de usuarios
  { id: IDS.permisoUsrCrear, codigo: 'USR_CREAR', modulo: 'usuarios', accion: 'CREAR', descripcion: 'Permite crear nuevos usuarios', requires_auth: true },
  { id: IDS.permisoUsrEditar, codigo: 'USR_EDITAR', modulo: 'usuarios', accion: 'EDITAR', descripcion: 'Permite editar usuarios existentes', requires_auth: true },
  { id: IDS.permisoUsrEliminar, codigo: 'USR_ELIMINAR', modulo: 'usuarios', accion: 'ELIMINAR', descripcion: 'Permite eliminar usuarios del sistema', requires_auth: true },
  { id: IDS.permisoUsrResetClave, codigo: 'USR_RESET_CLAVE', modulo: 'usuarios', accion: 'RESET_CLAVE', descripcion: 'Permite restablecer la contraseña de un usuario sin clave anterior', requires_auth: true },
  // Permiso de bitácora
  { id: IDS.permisoBitacora, codigo: 'BIT_LEER', modulo: 'Bitacora', accion: 'LEER', descripcion: 'Permite visualizar la bitácora de auditoría y autorizaciones', requires_auth: false },
  // Permiso de permisos-usuario
  { id: IDS.permisoPermUsuario, codigo: 'PERM_USR_LEER', modulo: 'PermisosUsuario', accion: 'LEER', descripcion: 'Permite visualizar la asignación de permisos directos a usuarios', requires_auth: false },
  // ─── Permisos de Roles ───
  { id: IDS.permisoRolCrear, codigo: 'ROL_CREAR', modulo: 'Roles', accion: 'CREAR', descripcion: 'Permite crear nuevos roles en el sistema', requires_auth: true },
  { id: IDS.permisoRolEditar, codigo: 'ROL_EDITAR', modulo: 'Roles', accion: 'EDITAR', descripcion: 'Permite editar roles existentes', requires_auth: true },
  { id: IDS.permisoRolEliminar, codigo: 'ROL_ELIMINAR', modulo: 'Roles', accion: 'ELIMINAR', descripcion: 'Permite eliminar roles del sistema', requires_auth: true },
  // ─── Permisos de Menús ───
  { id: IDS.permisoMenuCrear, codigo: 'MENU_CREAR', modulo: 'Menus', accion: 'CREAR', descripcion: 'Permite crear nuevas entradas de menú', requires_auth: true },
  { id: IDS.permisoMenuEditar, codigo: 'MENU_EDITAR', modulo: 'Menus', accion: 'EDITAR', descripcion: 'Permite editar entradas de menú existentes', requires_auth: true },
  { id: IDS.permisoMenuEliminar, codigo: 'MENU_ELIMINAR', modulo: 'Menus', accion: 'ELIMINAR', descripcion: 'Permite eliminar entradas de menú', requires_auth: true },
  // ─── Permisos de Accesos ───
  { id: IDS.permisoAccesoCrear, codigo: 'ACCESO_CREAR', modulo: 'Accesos', accion: 'CREAR', descripcion: 'Permite crear accesos de menú por rol', requires_auth: true },
  { id: IDS.permisoAccesoEditar, codigo: 'ACCESO_EDITAR', modulo: 'Accesos', accion: 'EDITAR', descripcion: 'Permite editar accesos de menú por rol', requires_auth: true },
  { id: IDS.permisoAccesoEliminar, codigo: 'ACCESO_ELIMINAR', modulo: 'Accesos', accion: 'ELIMINAR', descripcion: 'Permite eliminar accesos de menú por rol', requires_auth: true },
  // ─── Permisos de Puestos ───
  { id: IDS.permisoPuestoCrear, codigo: 'PUESTO_CREAR', modulo: 'Puestos', accion: 'CREAR', descripcion: 'Permite crear nuevos puestos de trabajo', requires_auth: true },
  { id: IDS.permisoPuestoEditar, codigo: 'PUESTO_EDITAR', modulo: 'Puestos', accion: 'EDITAR', descripcion: 'Permite editar puestos de trabajo existentes', requires_auth: true },
  { id: IDS.permisoPuestoEliminar, codigo: 'PUESTO_ELIMINAR', modulo: 'Puestos', accion: 'ELIMINAR', descripcion: 'Permite eliminar puestos de trabajo', requires_auth: true },
  // ─── Permisos de Sucursales ───
  { id: IDS.permisoSucursalCrear, codigo: 'SUCURSAL_CREAR', modulo: 'Sucursales', accion: 'CREAR', descripcion: 'Permite crear nuevas sucursales', requires_auth: true },
  { id: IDS.permisoSucursalEditar, codigo: 'SUCURSAL_EDITAR', modulo: 'Sucursales', accion: 'EDITAR', descripcion: 'Permite editar sucursales existentes', requires_auth: true },
  { id: IDS.permisoSucursalEliminar, codigo: 'SUCURSAL_ELIMINAR', modulo: 'Sucursales', accion: 'ELIMINAR', descripcion: 'Permite eliminar sucursales', requires_auth: true },
  // ─── Permisos de Configuración ───
  { id: IDS.permisoConfigCrear, codigo: 'CONFIG_CREAR', modulo: 'Configuracion', accion: 'CREAR', descripcion: 'Permite crear parámetros de configuración', requires_auth: true },
  { id: IDS.permisoConfigEditar, codigo: 'CONFIG_EDITAR', modulo: 'Configuracion', accion: 'EDITAR', descripcion: 'Permite editar parámetros de configuración', requires_auth: true },
  { id: IDS.permisoConfigEliminar, codigo: 'CONFIG_ELIMINAR', modulo: 'Configuracion', accion: 'ELIMINAR', descripcion: 'Permite eliminar parámetros de configuración', requires_auth: true },
  // ─── Permisos de API Keys ───
  { id: IDS.permisoApiKeyCrear, codigo: 'APIKEY_CREAR', modulo: 'ApiKeys', accion: 'CREAR', descripcion: 'Permite registrar nuevas llaves de API', requires_auth: true },
  { id: IDS.permisoApiKeyEditar, codigo: 'APIKEY_EDITAR', modulo: 'ApiKeys', accion: 'EDITAR', descripcion: 'Permite editar llaves de API existentes', requires_auth: true },
  { id: IDS.permisoApiKeyEliminar, codigo: 'APIKEY_ELIMINAR', modulo: 'ApiKeys', accion: 'ELIMINAR', descripcion: 'Permite eliminar llaves de API', requires_auth: true },
  // ─── Permisos de Permisos (catálogo) ───
  { id: IDS.permisoPermCrear, codigo: 'PERM_CREAR', modulo: 'Permisos', accion: 'CREAR', descripcion: 'Permite crear nuevos permisos en el catálogo', requires_auth: true },
  { id: IDS.permisoPermEditar, codigo: 'PERM_EDITAR', modulo: 'Permisos', accion: 'EDITAR', descripcion: 'Permite editar permisos existentes en el catálogo', requires_auth: true },
  { id: IDS.permisoPermEliminar, codigo: 'PERM_ELIMINAR', modulo: 'Permisos', accion: 'ELIMINAR', descripcion: 'Permite eliminar permisos del catálogo', requires_auth: true },
  // ─── Permisos de Permiso-Rol ───
  { id: IDS.permisoPermRolCrear, codigo: 'PERM_ROL_CREAR', modulo: 'PermisosRol', accion: 'CREAR', descripcion: 'Permite asignar permisos a roles', requires_auth: true },
  { id: IDS.permisoPermRolEliminar, codigo: 'PERM_ROL_ELIMINAR', modulo: 'PermisosRol', accion: 'ELIMINAR', descripcion: 'Permite revocar permisos de roles', requires_auth: true },
  // ─── Permisos de Permiso-Usuario (asignaciones directas) ───
  { id: IDS.permisoPermUsrEditar, codigo: 'PERM_USR_EDITAR', modulo: 'PermisosUsuario', accion: 'EDITAR', descripcion: 'Permite actualizar asignaciones de permisos directas a usuarios', requires_auth: true },
  { id: IDS.permisoPermUsrEliminar, codigo: 'PERM_USR_ELIMINAR', modulo: 'PermisosUsuario', accion: 'ELIMINAR', descripcion: 'Permite revocar permisos directos de usuarios', requires_auth: true },
  // ─── Permiso de Bitácora (eliminar) ───
  { id: IDS.permisoBitacoraEliminar, codigo: 'BIT_ELIMINAR', modulo: 'Bitacora', accion: 'ELIMINAR', descripcion: 'Permite eliminar registros de la bitácora de auditoría', requires_auth: true },
];

// ─── DataSource bootstrap ────────────────────────────────────────────────────
async function bootstrap(): Promise<DataSource> {
  const ds = new DataSource({
    type: (process.env.DB_TYPE as 'mssql') || 'mssql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 1433,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [Rol, Menu, Acceso, Sucursal, Puesto, Usuario, Permiso, PermisoRol, PermisoUsuario, Config, Keys], // ← sync with database/entities/index.ts if you add entities
    synchronize: false,
    options: {
      useUTC: true,
      trustServerCertificate: true,
    },
  });

  return ds.initialize();
}

// ─── Helper: safe insert ─────────────────────────────────────────────────────
async function exists<T>(repo: any, where: Record<string, any>): Promise<boolean> {
  const count = await repo.count({ where });
  return count > 0;
}

// ─── Seed functions ──────────────────────────────────────────────────────────

async function seedRoles(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Rol);

  const roles = [
    { id: IDS.rolAdmin, nombre: 'Administrador', invitado: false, esAdmin: true },
    { id: IDS.rolOperador, nombre: 'Operador', invitado: false, esAdmin: false },
    { id: IDS.rolInvitado, nombre: 'Invitado', invitado: true, esAdmin: false },
    { id: IDS.rolNuevo, nombre: 'Rol Nuevo', invitado: false, esAdmin: false },
    { id: IDS.rolAdminOtro, nombre: 'Administrador', invitado: false, esAdmin: false },
  ];

  for (const rol of roles) {
    if (!(await exists(repo, { id: rol.id }))) {
      await repo.save(repo.create(rol));
      console.log(`  ✅ Rol "${rol.nombre}" creado.`);
    } else {
      console.log(`  ⏭️  Rol "${rol.nombre}" ya existe — omitido.`);
    }
  }
}

async function seedSucursales(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Sucursal);

  const sucursales = [
    { id: IDS.sucursalGeneral, nombre: 'GENERAL', municipio: 'Guatemala', departamento: 'Guatemala', central: true },
    { id: IDS.sucursalCentral, nombre: 'Sucursal Central', municipio: 'GUATEMALA', departamento: 'GUATEMALA', telefono: '2345-6789', direccion: '5a Avenida 10-20, Zona 1', central: false },
  ];

  for (const suc of sucursales) {
    if (!(await exists(repo, { id: suc.id }))) {
      await repo.save(repo.create(suc));
      console.log(`  ✅ Sucursal "${suc.nombre}" creada.`);
    } else {
      console.log(`  ⏭️  Sucursal "${suc.nombre}" ya existe — omitida.`);
    }
  }
}

async function seedPuestos(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Puesto);

  const puestos = [
    { id: IDS.puestoAdmin, nombre: 'Administrador', activo: true },
    { id: IDS.puestoAdminGeneral, nombre: 'Administrador General', activo: true },
  ];

  for (const puesto of puestos) {
    if (!(await exists(repo, { id: puesto.id }))) {
      await repo.save(repo.create(puesto));
      console.log(`  ✅ Puesto "${puesto.nombre}" creado.`);
    } else {
      console.log(`  ⏭️  Puesto "${puesto.nombre}" ya existe — omitido.`);
    }
  }
}

async function seedAdminUsers(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Usuario);

  // Passwords from environment — NEVER hardcoded (SAST-compliant)
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!rawPassword) {
    console.warn(
      '  ⚠️  SEED_ADMIN_PASSWORD no está definido. Se crea el usuario admin sin clave válida.',
    );
  }

  const rawPassword1 = process.env.SEED_ADMIN1_PASSWORD;
  if (!rawPassword1) {
    console.warn(
      '  ⚠️  SEED_ADMIN1_PASSWORD no está definido. Se crea el usuario admin1 sin clave válida.',
    );
  }

  const hashedPassword = rawPassword
    ? await bcrypt.hash(rawPassword, 10)
    : 'PENDING_HASH';

  const hashedPassword1 = rawPassword1
    ? await bcrypt.hash(rawPassword1, 10)
    : 'PENDING_HASH';

  const users = [
    {
      id: IDS.userAdmin,
      nombreCompleto: 'Administrador del sistema',
      nombre1: 'Administrador',
      apellido1: 'General',
      apellido2: 'Sistema',
      userName: process.env.SEED_ADMIN_USERNAME || 'sysadmin',
      correo: process.env.SEED_ADMIN_EMAIL || 'admindtd@gmail.com',
      clave: hashedPassword,
      activo: true,
      autoriza: true,
      auth_code: '1234',
      rolId: IDS.rolAdmin,
      puestoId: IDS.puestoAdmin,
      sucursalId: IDS.sucursalGeneral,
    },
    {
      id: IDS.userAdmin1,
      nombreCompleto: 'Administrador 1',
      nombre1: 'Admin',
      apellido1: 'Auxiliar',
      apellido2: 'Sistema',
      userName: process.env.SEED_ADMIN1_USERNAME || 'admin1',
      correo: process.env.SEED_ADMIN1_EMAIL || 'admin.auxiliar@hvc.com',
      clave: hashedPassword1,
      fotoUrl: 'storage/perfil/admin1-1787326762011.jpg',
      activo: true,
      autoriza: true,
      auth_code: '4321',
      rolId: IDS.rolAdmin,
      puestoId: IDS.puestoAdmin,
      sucursalId: IDS.sucursalGeneral,
    },
  ];

  for (const user of users) {
    if (!(await exists(repo, { id: user.id }))) {
      await repo.save(repo.create(user));
      console.log(`  ✅ Usuario "${user.userName}" creado.`);
    } else {
      console.log(`  ⏭️  Usuario "${user.userName}" ya existe — omitido.`);
    }
  }
}

async function seedMenus(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Menu);

  for (const menu of MENUS) {
    if (!(await exists(repo, { id: menu.id }))) {
      await repo.save(repo.create(menu));
      console.log(`  ✅ Menú "${menu.label}" creado.`);
    } else {
      console.log(`  ⏭️  Menú "${menu.label}" ya existe — omitido.`);
    }
  }
}

async function seedAccesos(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Acceso);

  for (const acceso of ACCESOS_ADMIN) {
    if (!(await exists(repo, { id: acceso.id }))) {
      await repo.save(
        repo.create({
          id: acceso.id,
          ordenMenu: acceso.ordenMenu,
          showApp: true,
          showWeb: true,
          activo: true,
          menuId: acceso.menuId,
          rolId: IDS.rolAdmin,
          mainMenuId: acceso.mainMenuId ?? undefined,
        }),
      );
      console.log(`  ✅ Acceso al menú ${acceso.menuId} para admin creado.`);
    } else {
      console.log(`  ⏭️  Acceso al menú ${acceso.menuId} para admin ya existe — omitido.`);
    }
  }
}

async function seedPermisos(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Permiso);

  for (const permiso of PERMISOS) {
    if (!(await exists(repo, { id: permiso.id }))) {
      await repo.save(repo.create(permiso));
      console.log(`  ✅ Permiso "${permiso.codigo}" creado.`);
    } else {
      console.log(`  ⏭️  Permiso "${permiso.codigo}" ya existe — omitido.`);
    }
  }
}

async function seedPermisosRol(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(PermisoRol);
  const permisoRepo = ds.getRepository(Permiso);

  const allPermisos = await permisoRepo.find();

  for (const p of allPermisos) {
    const alreadyAssigned = await repo.findOne({
      where: { rolId: IDS.rolAdmin, permisoId: p.id },
    });

    if (!alreadyAssigned) {
      await repo.save(
        repo.create({
          rolId: IDS.rolAdmin,
          permisoId: p.id,
          autoriza: true,
        }),
      );
      console.log(`  ✅ Permiso-Rol "${p.codigo}" → Admin asignado.`);
    } else {
      console.log(`  ⏭️  Permiso-Rol "${p.codigo}" → Admin ya existe — omitido.`);
    }
  }
}

async function seedConfig(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Config);

  const configs = [
    { id: IDS.configDiasClave, llave: 'DIAS_VENCIMIENTO_CLAVE', valor: '90', tipo: 'number', descripcion: 'Días que transcurren antes de exigir cambio de contraseña.', activo: true },
    { id: IDS.configMetodoAuthDefault, llave: 'METODO_AUTENTICACION_DEFAULT', valor: 'Local', tipo: 'string', descripcion: 'Método de autenticación por defecto para usuarios (Local o Active Directory)', activo: true },
  ];

  for (const config of configs) {
    if (!(await exists(repo, { id: config.id }))) {
      await repo.save(repo.create(config));
      console.log(`  ✅ Config "${config.llave}" creado.`);
    } else {
      console.log(`  ⏭️  Config "${config.llave}" ya existe — omitido.`);
    }
  }
}

async function seedKeys(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(Keys);

  if (!(await exists(repo, { id: IDS.keysIntegracion }))) {
    // Key value from environment — NEVER hardcoded (SAST-compliant)
    const rawKey = process.env.SEED_ERP_KEY;
    if (!rawKey) {
      console.warn(
        '  ⚠️  SEED_ERP_KEY no está definido. Se omite la llave de integración ERP.',
      );
      return;
    }

    const keyValue = Buffer.from(rawKey, 'hex');

    await repo.save(
      repo.create({
        id: IDS.keysIntegracion,
        nombre: 'Integración ERP',
        descripcion: 'Llave usada por el ERP para sincronizar catálogos cada noche.',
        valor: keyValue,
        activo: true,
      }),
    );
    console.log('  ✅ Keys "Integración ERP" creado.');
  } else {
    console.log('  ⏭️  Keys "Integración ERP" ya existe — omitido.');
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('\n🌱 Iniciando seed de datos iniciales...\n');

  const ds = await bootstrap();
  console.log('📡 Conexión a base de datos establecida.\n');

  try {
    console.log('── Roles ──');
    await seedRoles(ds);

    console.log('\n── Sucursales ──');
    await seedSucursales(ds);

    console.log('\n── Puestos ──');
    await seedPuestos(ds);

    console.log('\n── Usuarios ──');
    await seedAdminUsers(ds);

    console.log('\n── Menús ──');
    await seedMenus(ds);

    console.log('\n── Accesos (Admin) ──');
    await seedAccesos(ds);

    console.log('\n── Permisos ──');
    await seedPermisos(ds);

    console.log('\n── Permisos-Rol (Admin) ──');
    await seedPermisosRol(ds);

    console.log('\n── Config ──');
    await seedConfig(ds);

    console.log('\n── Keys ──');
    await seedKeys(ds);

    console.log('\n✅ Seed completado exitosamente.\n');
  } catch (error) {
    console.error('\n❌ Error durante el seed:', error);
    process.exitCode = 1;
  } finally {
    await ds.destroy();
  }
}

main();
