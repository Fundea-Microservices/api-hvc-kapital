import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1725456000000 implements MigrationInterface {
  name = 'InitialSchema1725456000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Schema ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'auth')
        EXEC('CREATE SCHEMA auth');
    `);

    // ── Config ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Config]', 'U') IS NULL
      CREATE TABLE [auth].[Config] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [llave] nvarchar(50) NOT NULL,
        [valor] nvarchar(MAX) NOT NULL,
        [tipo] nvarchar(20) NOT NULL,
        [descripcion] nvarchar(300) NULL,
        [activo] bit DEFAULT 1 NOT NULL,
        [created_at] datetime DEFAULT getdate() NULL,
        [updated_at] datetime NULL,
        [deleted_at] datetime NULL,
        CONSTRAINT PK__Config__3213E83F6ABCE214 PRIMARY KEY (id),
        CONSTRAINT UQ__Config__B8B4879E9C7AAC46 UNIQUE (llave)
      );
    `);

    // ── Keys ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Keys]', 'U') IS NULL
      CREATE TABLE [auth].[Keys] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [nombre] nvarchar(50) NOT NULL,
        [descripcion] nvarchar(250) NOT NULL,
        [valor] binary(32) NOT NULL,
        [activo] bit DEFAULT 1 NOT NULL,
        [created_at] datetime DEFAULT getdate() NULL,
        [updated_at] datetime NULL,
        [deleted_at] datetime NULL,
        CONSTRAINT PK__Keys__3213E83F919015B5 PRIMARY KEY (id)
      );
    `);

    // ── Menu ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Menu]', 'U') IS NULL
      CREATE TABLE [auth].[Menu] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [label] nvarchar(30) NOT NULL,
        [descripcion] nvarchar(255) NULL,
        [pathApp] nvarchar(100) NULL,
        [pathWeb] nvarchar(100) NULL,
        [icono] nvarchar(80) NOT NULL,
        [color] nvarchar(30) NULL,
        [principal] bit DEFAULT 1 NOT NULL,
        [activo] bit DEFAULT 1 NOT NULL,
        [created_at] datetime DEFAULT getdate() NULL,
        [updated_at] datetime NULL,
        [deleted_at] datetime NULL,
        CONSTRAINT PK__Menu__3213E83F6DF54904 PRIMARY KEY (id)
      );
    `);

    // ── Permiso ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Permiso]', 'U') IS NULL
      CREATE TABLE [auth].[Permiso] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [codigo] nvarchar(20) NOT NULL,
        [modulo] nvarchar(50) NOT NULL,
        [accion] nvarchar(50) NOT NULL,
        [descripcion] nvarchar(250) NULL,
        [activo] bit DEFAULT 1 NOT NULL,
        [created_at] datetime DEFAULT getdate() NULL,
        [updated_at] datetime NULL,
        [requires_auth] bit DEFAULT 0 NOT NULL,
        CONSTRAINT PK__Permiso__3213E83FE3D7DF50 PRIMARY KEY (id),
        CONSTRAINT UQ__Permiso__40F9A20674E95DD7 UNIQUE (codigo)
      );
    `);

    // ── Puesto ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Puesto]', 'U') IS NULL
      CREATE TABLE [auth].[Puesto] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [nombre] nvarchar(80) NOT NULL,
        [activo] bit DEFAULT 1 NOT NULL,
        CONSTRAINT PK__Puesto__3213E83FCE8505C0 PRIMARY KEY (id)
      );
    `);

    // ── Rol ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Rol]', 'U') IS NULL
      CREATE TABLE [auth].[Rol] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [nombre] nvarchar(80) NOT NULL,
        [activo] bit DEFAULT 1 NOT NULL,
        [invitado] bit DEFAULT 0 NOT NULL,
        [esAdmin] bit DEFAULT 0 NOT NULL,
        [created_at] datetime DEFAULT getdate() NULL,
        [updated_at] datetime NULL,
        [deleted_at] datetime NULL,
        CONSTRAINT PK__Rol__3213E83F1B452945 PRIMARY KEY (id)
      );
    `);

    // ── sucursal ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[sucursal]', 'U') IS NULL
      CREATE TABLE [auth].[sucursal] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [nombre] nvarchar(150) NOT NULL,
        [municipio] nvarchar(100) NOT NULL,
        [departamento] nvarchar(100) NOT NULL,
        [telefono] nvarchar(20) NULL,
        [direccion] nvarchar(255) NULL,
        [central] bit DEFAULT 0 NOT NULL,
        [created_at] datetime DEFAULT getdate() NULL,
        CONSTRAINT PK__sucursal__3213E83F2F8AF173 PRIMARY KEY (id)
      );
    `);

    // ── Acceso (with inline FKs) ──────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Acceso]', 'U') IS NULL
      CREATE TABLE [auth].[Acceso] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [ordenMenu] int NOT NULL,
        [showApp] bit DEFAULT 1 NOT NULL,
        [showWeb] bit DEFAULT 1 NOT NULL,
        [activo] bit DEFAULT 1 NOT NULL,
        [menuId] uniqueidentifier NOT NULL,
        [rolId] uniqueidentifier NOT NULL,
        [mainMenuId] uniqueidentifier NULL,
        [created_at] datetime DEFAULT getdate() NULL,
        [updated_at] datetime NULL,
        [deleted_at] datetime NULL,
        CONSTRAINT PK__Acceso__3213E83FC50F6AD6 PRIMARY KEY (id),
        CONSTRAINT acceso_menu FOREIGN KEY (menuId) REFERENCES [auth].[Menu](id),
        CONSTRAINT acceso_rol FOREIGN KEY (rolId) REFERENCES [auth].[Rol](id)
      );
    `);

    // ── Permiso_Rol (with inline FKs) ─────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Permiso_Rol]', 'U') IS NULL
      CREATE TABLE [auth].[Permiso_Rol] (
        [rolId] uniqueidentifier NOT NULL,
        [permisoId] uniqueidentifier NOT NULL,
        [autoriza] bit DEFAULT 0 NOT NULL,
        CONSTRAINT PK__Permiso___5639646175A04F89 PRIMARY KEY (rolId, permisoId),
        CONSTRAINT FK_PermisoRol_Permiso FOREIGN KEY (permisoId) REFERENCES [auth].[Permiso](id) ON DELETE CASCADE,
        CONSTRAINT FK_PermisoRol_Rol FOREIGN KEY (rolId) REFERENCES [auth].[Rol](id) ON DELETE CASCADE
      );
    `);

    // ── Usuario (with inline FKs and filtered index) ──────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Usuario]', 'U') IS NULL
      CREATE TABLE [auth].[Usuario] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [nombreCompleto] nvarchar(250) NOT NULL,
        [userName] nvarchar(50) NOT NULL,
        [nombre1] nvarchar(50) NOT NULL,
        [nombre2] nvarchar(50) NULL,
        [nombre3] nvarchar(50) NULL,
        [apellido1] nvarchar(50) NOT NULL,
        [apellido2] nvarchar(50) NULL,
        [apellido3] nvarchar(50) NULL,
        [documento] nvarchar(30) NULL,
        [tipoDocumento] nvarchar(10) NULL,
        [clave] nvarchar(200) NOT NULL,
        [correo] nvarchar(60) NOT NULL,
        [fotoUrl] nvarchar(350) NULL,
        [lastPasswordUpdate] datetime DEFAULT getdate() NULL,
        [huella] text NULL,
        [activo] bit DEFAULT 1 NOT NULL,
        [rolId] uniqueidentifier NULL,
        [puestoId] uniqueidentifier NULL,
        [sucursalId] uniqueidentifier NULL,
        [created_at] datetime DEFAULT getdate() NULL,
        [updated_at] datetime NULL,
        [deleted_at] datetime NULL,
        [auth_code] nvarchar(10) NULL,
        [autoriza] bit DEFAULT 0 NOT NULL,
        CONSTRAINT PK__Usuario__3213E83FE27D42A6 PRIMARY KEY (id),
        CONSTRAINT UQ__Usuario__2A586E0B7882F018 UNIQUE (correo),
        CONSTRAINT UQ__Usuario__66DCF95C6FBEBAB0 UNIQUE (userName),
        CONSTRAINT user_puesto FOREIGN KEY (puestoId) REFERENCES [auth].[Puesto](id),
        CONSTRAINT user_roles FOREIGN KEY (rolId) REFERENCES [auth].[Rol](id),
        CONSTRAINT user_sucursal FOREIGN KEY (sucursalId) REFERENCES [auth].[sucursal](id)
      );
    `);

    // Filtered unique index on auth_code (cannot be inline in CREATE TABLE)
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Usuario_auth_code' AND object_id = OBJECT_ID('[auth].[Usuario]'))
      CREATE UNIQUE NONCLUSTERED INDEX UQ_Usuario_auth_code
        ON [auth].[Usuario]([auth_code] ASC)
        WHERE ([auth_code] IS NOT NULL)
        WITH (
          PAD_INDEX = OFF, FILLFACTOR = 100, SORT_IN_TEMPDB = OFF,
          IGNORE_DUP_KEY = OFF, STATISTICS_NORECOMPUTE = OFF,
          ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON
        ) ON [PRIMARY];
    `);

    // ── Bitacora_Autorizacion (with inline FKs) ──────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Bitacora_Autorizacion]', 'U') IS NULL
      CREATE TABLE [auth].[Bitacora_Autorizacion] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [endpoint] nvarchar(100) NOT NULL,
        [metodo_http] nvarchar(10) NOT NULL,
        [body_request] nvarchar(MAX) NOT NULL,
        [solicitanteId] uniqueidentifier NOT NULL,
        [autorizadorId] uniqueidentifier NOT NULL,
        [permisoId] uniqueidentifier NOT NULL,
        [created_at] datetime DEFAULT getdate() NULL,
        CONSTRAINT PK__Bitacora__3213E83F473452BF PRIMARY KEY (id),
        CONSTRAINT bit_auth_autorizador FOREIGN KEY (autorizadorId) REFERENCES [auth].[Usuario](id),
        CONSTRAINT bit_auth_permiso FOREIGN KEY (permisoId) REFERENCES [auth].[Permiso](id),
        CONSTRAINT bit_auth_solicitante FOREIGN KEY (solicitanteId) REFERENCES [auth].[Usuario](id)
      );
    `);

    // ── Permiso_Usuario (with inline FKs) ────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[Permiso_Usuario]', 'U') IS NULL
      CREATE TABLE [auth].[Permiso_Usuario] (
        [usuarioId] uniqueidentifier NOT NULL,
        [permisoId] uniqueidentifier NOT NULL,
        [permitido] bit DEFAULT 1 NOT NULL,
        [autoriza] bit DEFAULT 0 NOT NULL,
        CONSTRAINT PK__Permiso___A78AF9DB59B79225 PRIMARY KEY (usuarioId, permisoId),
        CONSTRAINT FK_PermisoUser_Permiso FOREIGN KEY (permisoId) REFERENCES [auth].[Permiso](id) ON DELETE CASCADE,
        CONSTRAINT FK_PermisoUser_User FOREIGN KEY (usuarioId) REFERENCES [auth].[Usuario](id) ON DELETE CASCADE
      );
    `);

    // ── Seed: Rol ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO [auth].[Rol] (id, nombre, activo, invitado, esAdmin, created_at)
      SELECT * FROM (VALUES
        ('E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'Administrador', 1, 0, 1, '2026-08-17 20:53:50.673'),
        ('3F46A1F3-1B4D-4B28-BC23-6F1C7AB9E67D', 'Operador',      1, 0, 0, '2026-08-17 20:53:50.693'),
        ('9A7317F7-2B7C-45B2-99E1-47C61A6D8A5F', 'Invitado',      1, 1, 0, '2026-08-17 20:53:50.707'),
        ('3309409C-E0F2-473C-8F45-5862F5C468BE', 'Rol Nuevo',     1, 0, 0, '2026-08-21 15:30:28.427'),
        ('411E1007-F97D-4C76-B710-BFC9BD4810E0', 'Administrador', 1, 0, 0, '2026-08-28 16:15:14.34')
      ) AS v(id, nombre, activo, invitado, esAdmin, created_at)
      WHERE NOT EXISTS (SELECT 1 FROM [auth].[Rol] r WHERE r.id = v.id);
    `);

    // ── Seed: Puesto ──────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO [auth].[Puesto] (id, nombre, activo)
      SELECT * FROM (VALUES
        ('C2E3D4F5-6A7B-4C8D-9E0F-1A2B3C4D5E6F', 'Administrador',         1),
        ('1BC05894-A92B-41C5-97A2-9DFABCF7D852', 'Administrador General', 1)
      ) AS v(id, nombre, activo)
      WHERE NOT EXISTS (SELECT 1 FROM [auth].[Puesto] p WHERE p.id = v.id);
    `);

    // ── Seed: sucursal ────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO [auth].[sucursal] (id, nombre, municipio, departamento, telefono, direccion, central, created_at)
      SELECT * FROM (VALUES
        ('B1D2C3E4-5F6A-4B7C-8D9E-0A1B2C3D4E5F', 'GENERAL',          'Guatemala', 'Guatemala', NULL, NULL,                    1, '2026-08-17 20:53:50.71'),
        ('F6C3D363-54A2-4396-8BB3-86CB377236E9', 'Sucursal Central', 'GUATEMALA', 'GUATEMALA', '2345-6789', '5a Avenida 10-20, Zona 1', 0, '2026-08-28 16:15:39.41')
      ) AS v(id, nombre, municipio, departamento, telefono, direccion, central, created_at)
      WHERE NOT EXISTS (SELECT 1 FROM [auth].[sucursal] s WHERE s.id = v.id);
    `);

    // ── Seed: Menu ────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo, created_at)
      SELECT * FROM (VALUES
        ('A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', 'Configuración',   'Configuración de roles, usuarios, menús y accesos', 'config',          '/config',          'settings',         'white', 1, 1, '2026-08-17 20:53:50.76'),
        ('49B66F96-FF63-4CB9-B0E3-D3C0048E2A44', 'Usuarios',        'Manejo de usuarios',                                '/config/usuarios', '/config/usuarios', 'circle-user-round','white', 0, 1, '2026-08-17 20:53:50.767'),
        ('FD4290C9-DCCB-41C5-90A1-2D0A0D1381A4', 'Roles',           'Manejo de roles',                                    '/config/roles',    '/config/roles',    'user-check',       'white', 0, 1, '2026-08-17 20:53:50.767'),
        ('F42F0E87-0C7C-4C12-8B4A-0197FE19BC9F', 'Menus',           'Manejo de los menús',                                '/config/menus',    '/config/menus',    'menu',             'white', 0, 1, '2026-08-17 20:53:50.767'),
        ('5F3C574F-6ED8-4512-BB78-E18409F1E160', 'Accesos',         'Manejo de los accesos por rol',                       '/config/accesos',  '/config/accesos',  'user-lock',        'white', 0, 1, '2026-08-17 20:53:50.767'),
        ('E17C1D08-FF07-4C96-B4F4-9295D4C9893C', 'Configuraciones', 'Variables generales',                                 '/config/general',  '/config/general',  'settings',         'white', 0, 1, '2026-08-17 20:53:50.767'),
        ('3F9D5B1B-0C57-4F60-982D-1C1A6B998C37', 'Puestos',         'Puestos de los usuarios',                             '/config/puestos',  '/config/puestos',  'users',            'white', 0, 1, '2026-08-17 20:53:50.767'),
        ('F47AC10B-58CC-4372-A567-0E02B2C3D479', 'Sucursales',      'Sucursales',                                          '/config/sucursales','/config/sucursales','store',           'white', 0, 1, '2026-08-17 20:53:50.77'),
        ('31DF4276-B38D-4AC8-9270-2466E509B3D9', 'Permisos',        'Permisos',                                            '/config/permisos', '/config/permisos', 'lock',             'white', 0, 1, '2026-08-17 20:53:50.77'),
        ('B584C48D-C624-403A-9743-DB10D38B86F7', 'Permisos - Rol',  'Permisos por rol',                                    '/config/permisos-rol','/config/permisos-rol','lock',         'white', 0, 1, '2026-08-17 20:53:50.77')
      ) AS v(id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo, created_at)
      WHERE NOT EXISTS (SELECT 1 FROM [auth].[Menu] m WHERE m.id = v.id);
    `);

    // ── Seed: Permiso ─────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO [auth].[Permiso] (id, codigo, modulo, accion, descripcion, activo, created_at, requires_auth)
      SELECT * FROM (VALUES
        ('8A57A8A0-6899-4EAF-97A9-CC5AB854A716', 'USR_CREAR', 'usuarios', 'CREAR', 'Permite crear nuevos usuarios', 1, '2026-08-28 16:15:45.25', 1)
      ) AS v(id, codigo, modulo, accion, descripcion, activo, created_at, requires_auth)
      WHERE NOT EXISTS (SELECT 1 FROM [auth].[Permiso] p WHERE p.id = v.id);
    `);

    // ── Seed: Usuario ─────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO [auth].[Usuario] (id, nombreCompleto, userName, nombre1, nombre2, nombre3, apellido1, apellido2, apellido3, documento, tipoDocumento, clave, correo, fotoUrl, lastPasswordUpdate, huella, activo, rolId, puestoId, sucursalId, created_at, auth_code, autoriza)
      SELECT * FROM (VALUES
        ('4A7E5179-48BF-4A45-8A5F-27E276AF1756', 'Administrador 1',       'admin1',   'Admin',     NULL, NULL, 'Auxiliar',  'Sistema', NULL, NULL, NULL, '$2b$10$7m7nJZNzMqtXoXuU2bq0b.E11v3kcvp3eDJWTj0MAhbRCtHA2vuAG', 'admin.auxiliar@hvc.com', 'storage/perfil/admin1-1787326762011.jpg', '2026-08-26 18:52:48.0', NULL, 1, 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'C2E3D4F5-6A7B-4C8D-9E0F-1A2B3C4D5E6F', 'B1D2C3E4-5F6A-4B7C-8D9E-0A1B2C3D4E5F', '2026-08-21 14:57:05.013', NULL, 0),
        ('D3F4E5A6-7B8C-4D9E-0F1A-2B3C4D5E6F7A', 'Administrador del sistema', 'sysadmin', 'Administrador', NULL, NULL, 'General', 'Sistema', NULL, NULL, NULL, 'contraseña123', 'admindtd@gmail.com', NULL, '2026-08-17 20:53:50.737', NULL, 1, 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'C2E3D4F5-6A7B-4C8D-9E0F-1A2B3C4D5E6F', 'B1D2C3E4-5F6A-4B7C-8D9E-0A1B2C3D4E5F', '2026-08-17 20:53:50.737', NULL, 0)
      ) AS v(id, nombreCompleto, userName, nombre1, nombre2, nombre3, apellido1, apellido2, apellido3, documento, tipoDocumento, clave, correo, fotoUrl, lastPasswordUpdate, huella, activo, rolId, puestoId, sucursalId, created_at, auth_code, autoriza)
      WHERE NOT EXISTS (SELECT 1 FROM [auth].[Usuario] u WHERE u.id = v.id);
    `);

    // ── Seed: Acceso ──────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId, created_at)
      SELECT * FROM (VALUES
        ('99B437EF-0721-4F09-A20B-CEEA6138C321', 1, 1, 1, 1, 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', NULL,               '2026-08-17 20:53:50.773'),
        ('2EE85342-7641-4E5A-BC4A-9ED84F341C5C', 1, 1, 1, 1, '49B66F96-FF63-4CB9-B0E3-D3C0048E2A44', 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', '2026-08-17 20:53:50.783'),
        ('43C75BA9-6CBC-4E74-98F9-3584CA5819E8', 2, 1, 1, 1, 'FD4290C9-DCCB-41C5-90A1-2D0A0D1381A4', 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', '2026-08-17 20:53:50.79'),
        ('FAA681A2-0028-44FF-99AD-363F651CF3C9', 3, 1, 1, 1, 'F42F0E87-0C7C-4C12-8B4A-0197FE19BC9F', 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', '2026-08-17 20:53:50.797'),
        ('93BF8560-4E82-4796-9273-42C014F525A8', 4, 1, 1, 1, '5F3C574F-6ED8-4512-BB78-E18409F1E160', 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', '2026-08-17 20:53:50.8'),
        ('B88EF61A-2C6A-4A66-BBE9-28AFC0D91E3A', 5, 1, 1, 1, 'E17C1D08-FF07-4C96-B4F4-9295D4C9893C', 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', '2026-08-17 20:53:50.81'),
        ('DCD5D1CA-DDC1-4E98-899F-8C934BBD56BB', 6, 1, 1, 1, '3F9D5B1B-0C57-4F60-982D-1C1A6B998C37', 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', '2026-08-17 20:53:50.827'),
        ('6A3EF19B-1233-4A27-838C-7ACDF59482A2', 7, 1, 1, 1, 'F47AC10B-58CC-4372-A567-0E02B2C3D479', 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', '2026-08-17 20:53:50.83'),
        ('6DC1B85D-67D0-40CA-895C-43727DD9EF4B', 8, 1, 1, 1, '31DF4276-B38D-4AC8-9270-2466E509B3D9', 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', '2026-08-17 20:53:50.833'),
        ('D20302E9-6D33-47C7-8162-63E68AD5E64F', 9, 1, 1, 1, 'B584C48D-C624-403A-9743-DB10D38B86F7', 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC', '2026-08-17 20:53:50.84')
      ) AS v(id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId, created_at)
      WHERE NOT EXISTS (SELECT 1 FROM [auth].[Acceso] a WHERE a.id = v.id);
    `);

    // ── Seed: Config ──────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO [auth].[Config] (id, llave, valor, tipo, descripcion, activo, created_at)
      SELECT * FROM (VALUES
        ('ED737CE7-A1CD-4E83-8A77-F177DAFA0300', 'DIAS_VENCIMIENTO_CLAVE', '90', 'number', 'Días que transcurren antes de exigir cambio de contraseña.', 1, '2026-08-28 16:15:37.703')
      ) AS v(id, llave, valor, tipo, descripcion, activo, created_at)
      WHERE NOT EXISTS (SELECT 1 FROM [auth].[Config] c WHERE c.id = v.id);
    `);

    // ── Seed: Keys ────────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO [auth].[Keys] (id, nombre, descripcion, valor, activo, created_at)
      SELECT * FROM (VALUES
        ('E90F144E-2EB4-4B98-9A52-40440BF19146', 'Integración ERP', 'Llave usada por el ERP para sincronizar catálogos cada noche.', 0xAA8F9415004E3D7033D37A16E2DDCF0894F4B5D9C0FF3B0A77B9398AA572149C, 1, '2026-08-28 16:15:30.51')
      ) AS v(id, nombre, descripcion, valor, activo, created_at)
      WHERE NOT EXISTS (SELECT 1 FROM [auth].[Keys] k WHERE k.id = v.id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dropOrder = [
      '[auth].[Permiso_Usuario]',
      '[auth].[Bitacora_Autorizacion]',
      '[auth].[Usuario]',
      '[auth].[Permiso_Rol]',
      '[auth].[Acceso]',
      '[auth].[Permiso]',
      '[auth].[Menu]',
      '[auth].[Keys]',
      '[auth].[Config]',
      '[auth].[Puesto]',
      '[auth].[sucursal]',
      '[auth].[Rol]',
    ];

    for (const table of dropOrder) {
      await queryRunner.query(`IF OBJECT_ID('${table}', 'U') IS NOT NULL DROP TABLE ${table};`);
    }
  }
}
