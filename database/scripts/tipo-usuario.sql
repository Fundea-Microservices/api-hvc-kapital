-- =============================================================================
-- Tabla auth.TipoUsuario + columna config.Carousel.tiposUsuario
-- Equivalente manual de la migración 1759900000000-CreateTipoUsuarioAndCarouselTiposUsuario.
-- Idempotente: se puede ejecutar aunque la migración ya haya corrido.
-- =============================================================================

IF OBJECT_ID('[auth].[TipoUsuario]', 'U') IS NULL
CREATE TABLE auth.TipoUsuario
(
    id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    codigo      VARCHAR(50)      NOT NULL, -- INVERSOR, EMPLEADO, ... (mayúsculas, sin comas ni espacios)
    nombre      VARCHAR(100)     NOT NULL, -- Nombre para mostrar: Inversor, Empleado, ...
    descripcion VARCHAR(500)     NULL,
    activo      BIT              NOT NULL DEFAULT 1,
    created_at  DATETIME         NOT NULL DEFAULT GETDATE(),
    updated_at  DATETIME         NULL,
    deleted_at  DATETIME         NULL,

    CONSTRAINT PK_auth_TipoUsuario PRIMARY KEY (id)
);
GO

-- Código único entre los registros no eliminados.
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UQ_auth_TipoUsuario_codigo' AND object_id = OBJECT_ID('[auth].[TipoUsuario]'))
    CREATE UNIQUE INDEX UQ_auth_TipoUsuario_codigo ON auth.TipoUsuario (codigo) WHERE deleted_at IS NULL;
GO

-- Códigos de auth.TipoUsuario separados por coma; NULL = sin filtro por tipo.
IF COL_LENGTH('config.Carousel', 'tiposUsuario') IS NULL
    ALTER TABLE config.Carousel ADD tiposUsuario NVARCHAR(MAX) NULL;
GO

-- Tipos iniciales (también los crea `npm run seed`).
IF NOT EXISTS (SELECT 1 FROM auth.TipoUsuario WHERE codigo = 'INVERSOR' AND deleted_at IS NULL)
    INSERT INTO auth.TipoUsuario (id, codigo, nombre, descripcion, activo)
    VALUES ('541DE9AC-3B27-4A12-81CF-B2FD83AA6EC7', 'INVERSOR', 'Inversor', 'Clientes que invierten en productos de HVC Kapital', 1);

IF NOT EXISTS (SELECT 1 FROM auth.TipoUsuario WHERE codigo = 'EMPLEADO' AND deleted_at IS NULL)
    INSERT INTO auth.TipoUsuario (id, codigo, nombre, descripcion, activo)
    VALUES ('8D05BA77-F377-418D-A475-07B0B9603454', 'EMPLEADO', 'Empleado', 'Colaboradores de HVC Kapital', 1);
GO

-- Permisos del módulo (también los crea `npm run seed`).
IF NOT EXISTS (SELECT 1 FROM auth.Permiso WHERE codigo = 'TIPO_USUARIO_CREAR')
    INSERT INTO auth.Permiso (id, codigo, modulo, accion, descripcion, activo, requires_auth)
    VALUES ('B9B66EB1-B0F3-4292-9CAC-958A0A77F7ED', 'TIPO_USUARIO_CREAR', 'TiposUsuario', 'CREAR', 'Permite crear tipos de usuario', 1, 0);

IF NOT EXISTS (SELECT 1 FROM auth.Permiso WHERE codigo = 'TIPO_USUARIO_EDITAR')
    INSERT INTO auth.Permiso (id, codigo, modulo, accion, descripcion, activo, requires_auth)
    VALUES ('D84AB967-61FE-4879-94DC-D3B773872298', 'TIPO_USUARIO_EDITAR', 'TiposUsuario', 'EDITAR', 'Permite editar tipos de usuario', 1, 0);

IF NOT EXISTS (SELECT 1 FROM auth.Permiso WHERE codigo = 'TIPO_USUARIO_ELIMINAR')
    INSERT INTO auth.Permiso (id, codigo, modulo, accion, descripcion, activo, requires_auth)
    VALUES ('18C26839-B311-426C-BB61-42FFA14ACE5D', 'TIPO_USUARIO_ELIMINAR', 'TiposUsuario', 'ELIMINAR', 'Permite eliminar (soft-delete) tipos de usuario', 1, 0);
GO

-- Asignar los permisos al rol Administrador (también lo hace `npm run seed`).
INSERT INTO auth.Permiso_Rol (rolId, permisoId, autoriza)
SELECT 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1', p.id, 1
FROM auth.Permiso p
WHERE p.codigo IN ('TIPO_USUARIO_CREAR', 'TIPO_USUARIO_EDITAR', 'TIPO_USUARIO_ELIMINAR')
  AND NOT EXISTS (SELECT 1 FROM auth.Permiso_Rol pr
                  WHERE pr.rolId = 'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1' AND pr.permisoId = p.id);
GO
