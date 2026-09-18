/* ─────────────────────────────────────────────────────────────────────────────
 * seed-menu-acceso.sql — Inserción manual de datos de Menu y Acceso
 *
 * Origen: database/seeds/main.seed.ts (MENUS y ACCESOS_ADMIN)
 * SAST-compliant: NO credentials hardcodeados.
 *
 * Uso:
 *   sqlcmd -S <server> -d <database> -U <user> -P <password> -i database/scripts/seed-menu-acceso.sql
 *
 * Seguro para ejecutar múltiples veces: usa verificaciones de existencia de ID.
 * ───────────────────────────────────────────────────────────────────────────── */

SET NOCOUNT ON;

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'auth')
    EXEC('CREATE SCHEMA auth');
GO

/* ──────────────────────────────────────────────────────────────────────────────
 * 1. MENÚS
 *
 * IDs determinísticos que coinciden con database/seeds/main.seed.ts
 * ────────────────────────────────────────────────────────────────────────────── */

DECLARE @menConfig uniqueidentifier = 'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC';
DECLARE @menUsuarios uniqueidentifier = '49B66F96-FF63-4CB9-B0E3-D3C0048E2A44';
DECLARE @menRoles uniqueidentifier = 'FD4290C9-DCCB-41C5-90A1-2D0A0D1381A4';
DECLARE @menMenus uniqueidentifier = 'F42F0E87-0C7C-4C12-8B4A-0197FE19BC9F';
DECLARE @menAccesos uniqueidentifier = '5F3C574F-6ED8-4512-BB78-E18409F1E160';
DECLARE @menConfiguraciones uniqueidentifier = 'E17C1D08-FF07-4C96-B4F4-9295D4C9893C';
DECLARE @menPuestos uniqueidentifier = '3F9D5B1B-0C57-4F60-982D-1C1A6B998C37';
DECLARE @menSucursales uniqueidentifier = 'F47AC10B-58CC-4372-A567-0E02B2C3D479';
DECLARE @menPermisos uniqueidentifier = '31DF4276-B38D-4AC8-9270-2466E509B3D9';
DECLARE @menPermisosRol uniqueidentifier = 'B584C48D-C624-403A-9743-DB10D38B86F7';

DECLARE @rolAdmin uniqueidentifier = 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1';

/* ── Función auxiliar para insertar menú si no existe ── */
DECLARE @menuCount int;

-- Configuración
SELECT @menuCount = COUNT(*) FROM [auth].[Menu] WHERE id = @menConfig;
IF @menuCount = 0
BEGIN
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo)
    VALUES (@menConfig, N'Configuración', N'Configuración de roles, usuarios, menús y accesos',
        N'config', N'/config', N'settings', N'white', 1, 1);
    PRINT '  ✅ Menú "Configuración" creado.';
END
ELSE
    PRINT '  ⏭️  Menú "Configuración" ya existe — omitido.';

-- Usuarios
SELECT @menuCount = COUNT(*) FROM [auth].[Menu] WHERE id = @menUsuarios;
IF @menuCount = 0
BEGIN
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo)
    VALUES (@menUsuarios, N'Usuarios', N'Manejo de usuarios',
        N'/config/usuarios', N'/config/usuarios', N'circle-user-round', N'white', 0, 1);
    PRINT '  ✅ Menú "Usuarios" creado.';
END
ELSE
    PRINT '  ⏭️  Menú "Usuarios" ya existe — omitido.';

-- Roles
SELECT @menuCount = COUNT(*) FROM [auth].[Menu] WHERE id = @menRoles;
IF @menuCount = 0
BEGIN
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo)
    VALUES (@menRoles, N'Roles', N'Manejo de roles',
        N'/config/roles', N'/config/roles', N'user-check', N'white', 0, 1);
    PRINT '  ✅ Menú "Roles" creado.';
END
ELSE
    PRINT '  ⏭️  Menú "Roles" ya existe — omitido.';

-- Menus
SELECT @menuCount = COUNT(*) FROM [auth].[Menu] WHERE id = @menMenus;
IF @menuCount = 0
BEGIN
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo)
    VALUES (@menMenus, N'Menus', N'Manejo de los menús',
        N'/config/menus', N'/config/menus', N'menu', N'white', 0, 1);
    PRINT '  ✅ Menú "Menus" creado.';
END
ELSE
    PRINT '  ⏭️  Menú "Menus" ya existe — omitido.';

-- Accesos
SELECT @menuCount = COUNT(*) FROM [auth].[Menu] WHERE id = @menAccesos;
IF @menuCount = 0
BEGIN
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo)
    VALUES (@menAccesos, N'Accesos', N'Manejo de los accesos por rol',
        N'/config/accesos', N'/config/accesos', N'user-lock', N'white', 0, 1);
    PRINT '  ✅ Menú "Accesos" creado.';
END
ELSE
    PRINT '  ⏭️  Menú "Accesos" ya existe — omitido.';

-- Configuraciones
SELECT @menuCount = COUNT(*) FROM [auth].[Menu] WHERE id = @menConfiguraciones;
IF @menuCount = 0
BEGIN
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo)
    VALUES (@menConfiguraciones, N'Configuraciones', N'Variables generales',
        N'/config/general', N'/config/general', N'settings', N'white', 0, 1);
    PRINT '  ✅ Menú "Configuraciones" creado.';
END
ELSE
    PRINT '  ⏭️  Menú "Configuraciones" ya existe — omitido.';

-- Puestos
SELECT @menuCount = COUNT(*) FROM [auth].[Menu] WHERE id = @menPuestos;
IF @menuCount = 0
BEGIN
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo)
    VALUES (@menPuestos, N'Puestos', N'Puestos de los usuarios',
        N'/config/puestos', N'/config/puestos', N'users', N'white', 0, 1);
    PRINT '  ✅ Menú "Puestos" creado.';
END
ELSE
    PRINT '  ⏭️  Menú "Puestos" ya existe — omitido.';

-- Sucursales
SELECT @menuCount = COUNT(*) FROM [auth].[Menu] WHERE id = @menSucursales;
IF @menuCount = 0
BEGIN
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo)
    VALUES (@menSucursales, N'Sucursales', N'Sucursales',
        N'/config/sucursales', N'/config/sucursales', N'store', N'white', 0, 1);
    PRINT '  ✅ Menú "Sucursales" creado.';
END
ELSE
    PRINT '  ⏭️  Menú "Sucursales" ya existe — omitido.';

-- Permisos
SELECT @menuCount = COUNT(*) FROM [auth].[Menu] WHERE id = @menPermisos;
IF @menuCount = 0
BEGIN
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo)
    VALUES (@menPermisos, N'Permisos', N'Permisos',
        N'/config/permisos', N'/config/permisos', N'lock', N'white', 0, 1);
    PRINT '  ✅ Menú "Permisos" creado.';
END
ELSE
    PRINT '  ⏭️  Menú "Permisos" ya existe — omitido.';

-- Permisos - Rol
SELECT @menuCount = COUNT(*) FROM [auth].[Menu] WHERE id = @menPermisosRol;
IF @menuCount = 0
BEGIN
    INSERT INTO [auth].[Menu] (id, label, descripcion, pathApp, pathWeb, icono, color, principal, activo)
    VALUES (@menPermisosRol, N'Permisos - Rol', N'Permisos por rol',
        N'/config/permisos-rol', N'/config/permisos-rol', N'lock', N'white', 0, 1);
    PRINT '  ✅ Menú "Permisos - Rol" creado.';
END
ELSE
    PRINT '  ⏭️  Menú "Permisos - Rol" ya existe — omitido.';

PRINT '';
PRINT '── Accesos (Admin) ──';

/* ──────────────────────────────────────────────────────────────────────────────
 * 2. ACCESOS
 *
 * Todos para el rol Administrador (IDs.rolAdmin)
 * mainMenuId = NULL solo para el menú principal (Configuración)
 * ────────────────────────────────────────────────────────────────────────────── */

-- Acceso 1: Configuración (menú principal)
IF NOT EXISTS (SELECT 1 FROM [auth].[Acceso] WHERE id = '99B437EF-0721-4F09-A20B-CEEA6138C321')
BEGIN
    INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId)
    VALUES ('99B437EF-0721-4F09-A20B-CEEA6138C321', 1, 1, 1, 1, @menConfig, @rolAdmin, NULL);
    PRINT '  ✅ Acceso al menú Configuración para admin creado.';
END
ELSE
    PRINT '  ⏭️  Acceso al menú Configuración para admin ya existe — omitido.';

-- Acceso 2: Usuarios
IF NOT EXISTS (SELECT 1 FROM [auth].[Acceso] WHERE id = '2EE85342-7641-4E5A-BC4A-9ED84F341C5C')
BEGIN
    INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId)
    VALUES ('2EE85342-7641-4E5A-BC4A-9ED84F341C5C', 1, 1, 1, 1, @menUsuarios, @rolAdmin, @menConfig);
    PRINT '  ✅ Acceso al menú Usuarios para admin creado.';
END
ELSE
    PRINT '  ⏭️  Acceso al menú Usuarios para admin ya existe — omitido.';

-- Acceso 3: Roles
IF NOT EXISTS (SELECT 1 FROM [auth].[Acceso] WHERE id = '43C75BA9-6CBC-4E74-98F9-3584CA5819E8')
BEGIN
    INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId)
    VALUES ('43C75BA9-6CBC-4E74-98F9-3584CA5819E8', 2, 1, 1, 1, @menRoles, @rolAdmin, @menConfig);
    PRINT '  ✅ Acceso al menú Roles para admin creado.';
END
ELSE
    PRINT '  ⏭️  Acceso al menú Roles para admin ya existe — omitido.';

-- Acceso 4: Menus
IF NOT EXISTS (SELECT 1 FROM [auth].[Acceso] WHERE id = 'FAA681A2-0028-44FF-99AD-363F651CF3C9')
BEGIN
    INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId)
    VALUES ('FAA681A2-0028-44FF-99AD-363F651CF3C9', 3, 1, 1, 1, @menMenus, @rolAdmin, @menConfig);
    PRINT '  ✅ Acceso al menú Menus para admin creado.';
END
ELSE
    PRINT '  ⏭️  Acceso al menú Menus para admin ya existe — omitido.';

-- Acceso 5: Accesos
IF NOT EXISTS (SELECT 1 FROM [auth].[Acceso] WHERE id = '93BF8560-4E82-4796-9273-42C014F525A8')
BEGIN
    INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId)
    VALUES ('93BF8560-4E82-4796-9273-42C014F525A8', 4, 1, 1, 1, @menAccesos, @rolAdmin, @menConfig);
    PRINT '  ✅ Acceso al menú Accesos para admin creado.';
END
ELSE
    PRINT '  ⏭️  Acceso al menú Accesos para admin ya existe — omitido.';

-- Acceso 6: Configuraciones
IF NOT EXISTS (SELECT 1 FROM [auth].[Acceso] WHERE id = 'B88EF61A-2C6A-4A66-BBE9-28AFC0D91E3A')
BEGIN
    INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId)
    VALUES ('B88EF61A-2C6A-4A66-BBE9-28AFC0D91E3A', 5, 1, 1, 1, @menConfiguraciones, @rolAdmin, @menConfig);
    PRINT '  ✅ Acceso al menú Configuraciones para admin creado.';
END
ELSE
    PRINT '  ⏭️  Acceso al menú Configuraciones para admin ya existe — omitido.';

-- Acceso 7: Puestos
IF NOT EXISTS (SELECT 1 FROM [auth].[Acceso] WHERE id = 'DCD5D1CA-DDC1-4E98-899F-8C934BBD56BB')
BEGIN
    INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId)
    VALUES ('DCD5D1CA-DDC1-4E98-899F-8C934BBD56BB', 6, 1, 1, 1, @menPuestos, @rolAdmin, @menConfig);
    PRINT '  ✅ Acceso al menú Puestos para admin creado.';
END
ELSE
    PRINT '  ⏭️  Acceso al menú Puestos para admin ya existe — omitido.';

-- Acceso 8: Sucursales
IF NOT EXISTS (SELECT 1 FROM [auth].[Acceso] WHERE id = '6A3EF19B-1233-4A27-838C-7ACDF59482A2')
BEGIN
    INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId)
    VALUES ('6A3EF19B-1233-4A27-838C-7ACDF59482A2', 7, 1, 1, 1, @menSucursales, @rolAdmin, @menConfig);
    PRINT '  ✅ Acceso al menú Sucursales para admin creado.';
END
ELSE
    PRINT '  ⏭️  Acceso al menú Sucursales para admin ya existe — omitido.';

-- Acceso 9: Permisos
IF NOT EXISTS (SELECT 1 FROM [auth].[Acceso] WHERE id = '6DC1B85D-67D0-40CA-895C-43727DD9EF4B')
BEGIN
    INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId)
    VALUES ('6DC1B85D-67D0-40CA-895C-43727DD9EF4B', 8, 1, 1, 1, @menPermisos, @rolAdmin, @menConfig);
    PRINT '  ✅ Acceso al menú Permisos para admin creado.';
END
ELSE
    PRINT '  ⏭️  Acceso al menú Permisos para admin ya existe — omitido.';

-- Acceso 10: Permisos - Rol
IF NOT EXISTS (SELECT 1 FROM [auth].[Acceso] WHERE id = 'D20302E9-6D33-47C7-8162-63E68AD5E64F')
BEGIN
    INSERT INTO [auth].[Acceso] (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId)
    VALUES ('D20302E9-6D33-47C7-8162-63E68AD5E64F', 9, 1, 1, 1, @menPermisosRol, @rolAdmin, @menConfig);
    PRINT '  ✅ Acceso al menú Permisos - Rol para admin creado.';
END
ELSE
    PRINT '  ⏭️  Acceso al menú Permisos - Rol para admin ya existe — omitido.';

PRINT '';
PRINT '✅ Seed de Menús y Accesos completado exitosamente.';
