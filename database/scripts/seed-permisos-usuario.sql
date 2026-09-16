/* ─────────────────────────────────────────────────────────────────────────────
 * seed-permisos-usuario.sql — Inserta los permisos USR_* en la tabla Permiso
 *
 * Complementa el tagging de endpoints con @RequirePermissions en
 * UsuariosController:
 *   POST   /auth/usuarios             → USR_CREAR
 *   PUT    /auth/usuarios/:id         → USR_EDITAR
 *   DELETE /auth/usuarios/:id         → USR_ELIMINAR
 *   POST   /auth/usuarios/reset-clave → USR_RESET_CLAVE
 *
 * Todos los permisos se crean con requires_auth = 1, por lo que su ejecución
 * exige auth_code de OTRO usuario autorizador (aplica también a admins).
 *
 * Los IDs coinciden con database/seeds/main.seed.ts (IDS.permisoUsr*).
 * Idempotente: seguro para ejecutar múltiples veces (verifica existencia).
 *
 * Uso:
 *   sqlcmd -S <server> -d <database> -U <user> -P <password> -i database/scripts/seed-permisos-usuario.sql
 * ───────────────────────────────────────────────────────────────────────────── */

SET NOCOUNT ON;

DECLARE @permisoUsrEditar     uniqueidentifier = 'D4B7E9F1-3A2C-4E8B-9F5D-1C7A2B6E8D03';
DECLARE @permisoUsrEliminar   uniqueidentifier = 'F1C2A8D5-9E4B-4D7F-A3C6-5B8D2E7F4A19';
DECLARE @permisoUsrResetClave uniqueidentifier = 'B6E3F7A2-1D5C-4A9E-8B4F-7C2D9E5A6B84';

DECLARE @rolAdmin uniqueidentifier = 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1';

DECLARE @permisoCount int;

/* ── USR_EDITAR ── */
SELECT @permisoCount = COUNT(*) FROM [auth].[Permiso] WHERE id = @permisoUsrEditar;
IF @permisoCount = 0
BEGIN
    INSERT INTO [auth].[Permiso] (id, codigo, modulo, accion, descripcion, activo, requires_auth)
    VALUES (@permisoUsrEditar, N'USR_EDITAR', N'usuarios', N'EDITAR',
            N'Permite editar usuarios existentes', 1, 1);
    PRINT '  ✅ Permiso "USR_EDITAR" creado.';
END
ELSE
    PRINT '  ⏭️  Permiso "USR_EDITAR" ya existe — omitido.';

/* ── USR_ELIMINAR ── */
SELECT @permisoCount = COUNT(*) FROM [auth].[Permiso] WHERE id = @permisoUsrEliminar;
IF @permisoCount = 0
BEGIN
    INSERT INTO [auth].[Permiso] (id, codigo, modulo, accion, descripcion, activo, requires_auth)
    VALUES (@permisoUsrEliminar, N'USR_ELIMINAR', N'usuarios', N'ELIMINAR',
            N'Permite eliminar usuarios del sistema', 1, 1);
    PRINT '  ✅ Permiso "USR_ELIMINAR" creado.';
END
ELSE
    PRINT '  ⏭️  Permiso "USR_ELIMINAR" ya existe — omitido.';

/* ── USR_RESET_CLAVE ── */
SELECT @permisoCount = COUNT(*) FROM [auth].[Permiso] WHERE id = @permisoUsrResetClave;
IF @permisoCount = 0
BEGIN
    INSERT INTO [auth].[Permiso] (id, codigo, modulo, accion, descripcion, activo, requires_auth)
    VALUES (@permisoUsrResetClave, N'USR_RESET_CLAVE', N'usuarios', N'RESET_CLAVE',
            N'Permite restablecer la contraseña de un usuario sin clave anterior', 1, 1);
    PRINT '  ✅ Permiso "USR_RESET_CLAVE" creado.';
END
ELSE
    PRINT '  ⏭️  Permiso "USR_RESET_CLAVE" ya existe — omitido.';

/* ── Asignar los permisos al rol Administrador con autoriza = true ── */
DECLARE @asignacionCount int;

SELECT @asignacionCount = COUNT(*) FROM [auth].[Permiso_Rol]
WHERE rolId = @rolAdmin AND permisoId = @permisoUsrEditar;
IF @asignacionCount = 0
BEGIN
    INSERT INTO [auth].[Permiso_Rol] (rolId, permisoId, autoriza)
    VALUES (@rolAdmin, @permisoUsrEditar, 1);
    PRINT '  ✅ Permiso_Rol "USR_EDITAR" → Admin asignado (autoriza=1).';
END
ELSE
    PRINT '  ⏭️  Permiso_Rol "USR_EDITAR" → Admin ya existe — omitido.';

SELECT @asignacionCount = COUNT(*) FROM [auth].[Permiso_Rol]
WHERE rolId = @rolAdmin AND permisoId = @permisoUsrEliminar;
IF @asignacionCount = 0
BEGIN
    INSERT INTO [auth].[Permiso_Rol] (rolId, permisoId, autoriza)
    VALUES (@rolAdmin, @permisoUsrEliminar, 1);
    PRINT '  ✅ Permiso_Rol "USR_ELIMINAR" → Admin asignado (autoriza=1).';
END
ELSE
    PRINT '  ⏭️  Permiso_Rol "USR_ELIMINAR" → Admin ya existe — omitido.';

SELECT @asignacionCount = COUNT(*) FROM [auth].[Permiso_Rol]
WHERE rolId = @rolAdmin AND permisoId = @permisoUsrResetClave;
IF @asignacionCount = 0
BEGIN
    INSERT INTO [auth].[Permiso_Rol] (rolId, permisoId, autoriza)
    VALUES (@rolAdmin, @permisoUsrResetClave, 1);
    PRINT '  ✅ Permiso_Rol "USR_RESET_CLAVE" → Admin asignado (autoriza=1).';
END
ELSE
    PRINT '  ⏭️  Permiso_Rol "USR_RESET_CLAVE" → Admin ya existe — omitido.';

PRINT 'Seed de permisos USR_* completado.';
