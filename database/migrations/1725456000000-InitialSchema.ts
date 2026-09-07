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

    // ── Los datos iniciales se insertan via `npm run seed` ─────────────────
    // La migración solo contiene DDL (estructura). Los INSERTs con
    // credenciales y datos sensibles están en database/seeds/main.seed.ts
    // para cumplir con SAST (Semgrep): ver SEMGREP-FIX.md
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
