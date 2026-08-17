BEGIN TRY
    BEGIN TRANSACTION;

    /* 1. Esquema */
    IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'auth')
        EXEC('CREATE SCHEMA auth');

    /* 2. Limpieza de tablas previas (hijos antes que padres) */
    IF OBJECT_ID('[auth].[Permiso_Usuario]', 'U') IS NOT NULL DROP TABLE [auth].[Permiso_Usuario];
    IF OBJECT_ID('[auth].[Permiso_Rol]', 'U') IS NOT NULL DROP TABLE [auth].[Permiso_Rol];
    IF OBJECT_ID('[auth].[Permiso]', 'U') IS NOT NULL DROP TABLE [auth].[Permiso];
    IF OBJECT_ID('[auth].[Acceso]', 'U') IS NOT NULL DROP TABLE [auth].[Acceso];
    IF OBJECT_ID('[auth].[Menu]', 'U') IS NOT NULL DROP TABLE [auth].[Menu];
    IF OBJECT_ID('[auth].[Usuario]', 'U') IS NOT NULL DROP TABLE [auth].[Usuario];
    IF OBJECT_ID('[auth].[Config]', 'U') IS NOT NULL DROP TABLE [auth].[Config];
    IF OBJECT_ID('[auth].[Keys]', 'U') IS NOT NULL DROP TABLE [auth].[Keys];
    IF OBJECT_ID('[auth].[Puesto]', 'U') IS NOT NULL DROP TABLE [auth].[Puesto];
    IF OBJECT_ID('[auth].[sucursal]', 'U') IS NOT NULL DROP TABLE [auth].[sucursal];
    IF OBJECT_ID('[auth].[Rol]', 'U') IS NOT NULL DROP TABLE [auth].[Rol];

    /* 3. Creación de Tablas */

    CREATE TABLE [auth].[Config] (
        [id] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        [llave] nvarchar(50) NOT NULL UNIQUE,
        [valor] nvarchar(MAX) NOT NULL,
        [tipo] nvarchar(20) NOT NULL,
        [descripcion] nvarchar(300),
        [activo] BIT NOT NULL DEFAULT (1),
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME,
        [deleted_at] DATETIME
    )

    CREATE TABLE [auth].[Rol] (
        [id] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        [nombre] nvarchar(80) NOT NULL,
        [activo] BIT NOT NULL DEFAULT (1),
        [invitado] BIT NOT NULL DEFAULT (0),
        [esAdmin] BIT NOT NULL DEFAULT (0),
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME,
        [deleted_at] DATETIME
    )

    CREATE TABLE [auth].[Puesto] (
        [id] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        [nombre] nvarchar(80) NOT NULL,
        [activo] BIT NOT NULL DEFAULT (1)
    )

    CREATE TABLE [auth].[sucursal] (
        [id] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        [nombre] nvarchar(150) NOT NULL,
        [municipio] nvarchar(100) NOT NULL,
        [departamento] nvarchar(100) NOT NULL,
        [telefono] nvarchar(20) NULL,
        [direccion] nvarchar(255) NULL,
        [central] BIT NOT NULL DEFAULT (0),
        [created_at] DATETIME DEFAULT GETDATE()
    )

    CREATE TABLE [auth].[Usuario] (
        [id] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        [nombreCompleto] nvarchar(250) NOT NULL,
        [userName] nvarchar(50) UNIQUE NOT NULL,
        [nombre1] nvarchar(50) NOT NULL,
        [nombre2] nvarchar(50) NULL,
        [nombre3] nvarchar(50) NULL,
        [apellido1] nvarchar(50) NOT NULL,
        [apellido2] nvarchar(50) NULL,
        [apellido3] nvarchar(50) NULL,
        [documento] nvarchar(30) NULL,
        [tipoDocumento] nvarchar(10) NULL,
        [clave] nvarchar(200) NOT NULL,
        [correo] nvarchar(60) UNIQUE NOT NULL,
        [fotoUrl] nvarchar(350) NULL,
        [lastPasswordUpdate] DATETIME DEFAULT GETDATE(),
        [huella] text,
        [activo] BIT NOT NULL DEFAULT (1),
        [estados] nvarchar(200) NULL,
        [rolId] uniqueidentifier,
        [puestoId] uniqueidentifier NULL,
        [sucursalId] uniqueidentifier NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME,
        [deleted_at] DATETIME
    )

    CREATE TABLE [auth].[Menu] (
        [id] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        [label] nvarchar(30) NOT NULL,
        [descripcion] nvarchar(255),
        [pathApp] nvarchar(100) NULL,
        [pathWeb] nvarchar(100) NULL,
        [icono] nvarchar(80) NOT NULL,
        [color] nvarchar(30) NULL,
        [principal] BIT NOT NULL DEFAULT (1),
        [activo] BIT NOT NULL DEFAULT (1),
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME,
        [deleted_at] DATETIME
    )

    CREATE TABLE [auth].[Acceso] (
        [id] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        [ordenMenu] integer NOT NULL,
        [showApp] BIT NOT NULL DEFAULT (1),
        [showWeb] BIT NOT NULL DEFAULT (1),
        [activo] BIT NOT NULL DEFAULT (1),
        [menuId] uniqueidentifier NOT NULL,
        [rolId] uniqueidentifier NOT NULL,
        [mainMenuId] uniqueidentifier NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME,
        [deleted_at] DATETIME
    )

    CREATE TABLE [auth].[Keys] (
        [id] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        [nombre] nvarchar(50) NOT NULL,
        [descripcion] nvarchar(250) NOT NULL,
        [valor] binary(32) NOT NULL,
        [activo] BIT NOT NULL DEFAULT (1),
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME,
        [deleted_at] DATETIME
    )

    /* Tablas de Permisos (API) */
    CREATE TABLE [auth].[Permiso] (
        [id] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
        [codigo] nvarchar(20) NOT NULL UNIQUE,   -- Ej: 'PRO01', 'PRO02'
        [modulo] nvarchar(50) NOT NULL,          -- Ej: 'Inventario'
        [accion] nvarchar(50) NOT NULL,          -- Ej: 'CREAR', 'LEER', 'EDITAR', 'ELIMINAR'
        [descripcion] nvarchar(250),             -- Ej: 'Permite crear un nuevo producto'
        [activo] BIT NOT NULL DEFAULT (1),
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME
    )

    -- Relación Muchos a Muchos: Un rol tiene muchos permisos
    CREATE TABLE [auth].[Permiso_Rol] (
        [rolId] uniqueidentifier NOT NULL,
        [permisoId] uniqueidentifier NOT NULL,
        PRIMARY KEY ([rolId], [permisoId])
    )

    -- Excepciones por Usuario (modelo híbrido)
    CREATE TABLE [auth].[Permiso_Usuario] (
        [usuarioId] uniqueidentifier NOT NULL,
        [permisoId] uniqueidentifier NOT NULL,
        [permitido] BIT NOT NULL DEFAULT (1),    -- 1 = Otorga el permiso, 0 = Deniega (sobrescribe al rol)
        PRIMARY KEY ([usuarioId], [permisoId])
    )

    /* 4. Llaves Foráneas */

    ALTER TABLE [auth].[Usuario] ADD CONSTRAINT [user_roles] FOREIGN KEY ([rolId]) REFERENCES [auth].[Rol] ([id]);
    ALTER TABLE [auth].[Usuario] ADD CONSTRAINT [user_sucursal] FOREIGN KEY ([sucursalId]) REFERENCES [auth].[sucursal] ([id]);
    ALTER TABLE [auth].[Usuario] ADD CONSTRAINT [user_puesto] FOREIGN KEY ([puestoId]) REFERENCES [auth].[Puesto] ([id]);

    ALTER TABLE [auth].[Acceso] ADD CONSTRAINT [acceso_rol] FOREIGN KEY ([rolId]) REFERENCES [auth].[Rol] ([id]);
    ALTER TABLE [auth].[Acceso] ADD CONSTRAINT [acceso_menu] FOREIGN KEY ([menuId]) REFERENCES [auth].[Menu] ([id]);

    ALTER TABLE [auth].[Permiso_Rol] ADD CONSTRAINT [FK_PermisoRol_Rol] FOREIGN KEY ([rolId]) REFERENCES [auth].[Rol] ([id]) ON DELETE CASCADE;
    ALTER TABLE [auth].[Permiso_Rol] ADD CONSTRAINT [FK_PermisoRol_Permiso] FOREIGN KEY ([permisoId]) REFERENCES [auth].[Permiso] ([id]) ON DELETE CASCADE;

    ALTER TABLE [auth].[Permiso_Usuario] ADD CONSTRAINT [FK_PermisoUser_User] FOREIGN KEY ([usuarioId]) REFERENCES [auth].[Usuario] ([id]) ON DELETE CASCADE;
    ALTER TABLE [auth].[Permiso_Usuario] ADD CONSTRAINT [FK_PermisoUser_Permiso] FOREIGN KEY ([permisoId]) REFERENCES [auth].[Permiso] ([id]) ON DELETE CASCADE;

    /* 5. SEEDS (Datos de prueba) */

    DECLARE @rolAdm uniqueidentifier;
    DECLARE @rolOpera uniqueidentifier;
    DECLARE @rolInvitado uniqueidentifier;
    DECLARE @sucGeneral uniqueidentifier;
    DECLARE @puestoAdmin uniqueidentifier;
    DECLARE @usrAdmin uniqueidentifier;
    DECLARE @menConfig uniqueidentifier;

    SET @rolAdm = 'e6e4b01c-5e2b-4d59-9a8e-6bfb8d32d7a1';
    SET @rolOpera = '3f46a1f3-1b4d-4b28-bc23-6f1c7ab9e67d';
    SET @rolInvitado = '9a7317f7-2b7c-45b2-99e1-47c61a6d8a5f';
    SET @sucGeneral = 'b1d2c3e4-5f6a-4b7c-8d9e-0a1b2c3d4e5f';
    SET @puestoAdmin = 'c2e3d4f5-6a7b-4c8d-9e0f-1a2b3c4d5e6f';
    SET @usrAdmin = 'd3f4e5a6-7b8c-4d9e-0f1a-2b3c4d5e6f7a';
    SET @menConfig = 'a328a6c4-bf37-4e9c-8619-d27f83c7e6ec';

    INSERT INTO [auth].[Rol] (id, nombre, invitado, esAdmin) VALUES (@rolAdm, 'Administrador', 0, 1);
    INSERT INTO [auth].[Rol] (id, nombre, invitado, esAdmin) VALUES (@rolOpera, 'Operador', 0, 0);
    INSERT INTO [auth].[Rol] (id, nombre, invitado, esAdmin) VALUES (@rolInvitado, 'Invitado', 1, 0);

    -- Sucursal y puesto por defecto
    INSERT INTO [auth].[sucursal] (id, nombre, municipio, departamento, central) VALUES (@sucGeneral, 'GENERAL', 'Guatemala', 'Guatemala', 1);
    INSERT INTO [auth].[Puesto] (id, nombre, activo) VALUES (@puestoAdmin, 'Administrador', 1);

    -- Usuario administrador (con ID fijo para asignarle sucursal y puesto)
    INSERT INTO [auth].[Usuario] (id, nombreCompleto, userName, correo, clave, nombre1, apellido1, apellido2, rolId, puestoId, sucursalId)
        VALUES (@usrAdmin, 'Administrador del sistema', 'sysadmin', 'admindtd@gmail.com', '$2b$10$i9bq23.nmQ1YM/bp1REvr.Jiuu48V5nem/NmxkFszsRPzlOPp6vly',
            'Administrador', 'General', 'Sistema', @rolAdm, @puestoAdmin, @sucGeneral);

    -- Menús
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES (@menConfig, 'Configuración', 'Configuración de roles, usuarios, menús y accesos', 'config', '/config', 'settings', 'black', 1);
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('49b66f96-ff63-4cb9-b0e3-d3c0048e2a44', 'Usuarios', 'Manejo de usuarios', '/config/usuarios', '/config/usuarios', 'circle-user-round', 'black', 0);
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('fd4290c9-dccb-41c5-90a1-2d0a0d1381a4', 'Roles', 'Manejo de roles', '/config/roles', '/config/roles', 'user-check', 'black', 0);
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('f42f0e87-0c7c-4c12-8b4a-0197fe19bc9f', 'Menus', 'Manejo de los menús', '/config/menus', '/config/menus', 'menu', 'black', 0);
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('5f3c574f-6ed8-4512-bb78-e18409f1e160', 'Accesos', 'Manejo de los accesos por rol', '/config/accesos', '/config/accesos', 'user-lock', 'black', 0);
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('e17c1d08-ff07-4c96-b4f4-9295d4c9893c', 'Configuraciones', 'Variables generales', '/config/general', '/config/general', 'settings', 'black', 0);
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('3f9d5b1b-0c57-4f60-982d-1c1a6b998c37', 'Puestos', 'Puestos de los usuarios', '/config/puestos', '/config/puestos', 'users', 'black', 0);
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Sucursales', 'Sucursales', '/config/sucursales', '/config/sucursales', 'store', 'black', 0);
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('31df4276-b38d-4ac8-9270-2466e509b3d9', 'Permisos', 'Permisos', '/config/permisos', '/config/permisos', 'lock', 'black', 0);
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('b584c48d-c624-403a-9743-db10d38b86f7', 'Permisos - Rol', 'Permisos por rol', '/config/permisos-rol', '/config/permisos-rol', 'lock', 'black', 0);

    -- Accesos
    INSERT INTO [auth].[Acceso] (ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (1, 1, 1, 1, @menConfig, @rolAdm, NULL);
    INSERT INTO [auth].[Acceso] (ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (1, 1, 1, 1, '49b66f96-ff63-4cb9-b0e3-d3c0048e2a44', @rolAdm, @menConfig);
    INSERT INTO [auth].[Acceso] (ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (2, 1, 1, 1, 'fd4290c9-dccb-41c5-90a1-2d0a0d1381a4', @rolAdm, @menConfig);
    INSERT INTO [auth].[Acceso] (ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (3, 1, 1, 1, 'f42f0e87-0c7c-4c12-8b4a-0197fe19bc9f', @rolAdm, @menConfig);
    INSERT INTO [auth].[Acceso] (ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (4, 1, 1, 1, '5f3c574f-6ed8-4512-bb78-e18409f1e160', @rolAdm, @menConfig);
    INSERT INTO [auth].[Acceso] (ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (5, 1, 1, 1, 'e17c1d08-ff07-4c96-b4f4-9295d4c9893c', @rolAdm, @menConfig);
    INSERT INTO [auth].[Acceso] (ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (6, 1, 1, 1, '3f9d5b1b-0c57-4f60-982d-1c1a6b998c37', @rolAdm, @menConfig);
    INSERT INTO [auth].[Acceso] (ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (7, 1, 1, 1, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', @rolAdm, @menConfig);
    INSERT INTO [auth].[Acceso] (ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (8, 1, 1, 1, '31df4276-b38d-4ac8-9270-2466e509b3d9', @rolAdm, @menConfig);
    INSERT INTO [auth].[Acceso] (ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (9, 1, 1, 1, 'b584c48d-c624-403a-9743-db10d38b86f7', @rolAdm, @menConfig);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;

    PRINT ERROR_MESSAGE();
END CATCH
