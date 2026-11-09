-- =============================================================================
-- Esquema config + tabla config.Carousel
-- Equivalente manual de la migración 1759800000000-CreateConfigSchemaAndCarousel.
-- Idempotente: se puede ejecutar aunque la migración ya haya corrido.
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'config')
    EXEC('CREATE SCHEMA config');
GO

IF OBJECT_ID('[config].[Carousel]', 'U') IS NULL
CREATE TABLE config.Carousel
(
    carouselId     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    titulo         NVARCHAR(200)    NOT NULL,
    subtitulo      NVARCHAR(200)    NULL,
    codigo         NVARCHAR(20)     NULL,
    descripcion    NVARCHAR(MAX)    NULL,
    fotoUrl        NVARCHAR(MAX)    NOT NULL,
    redireccionUrl NVARCHAR(MAX)    NULL,

    orden          INT              NOT NULL DEFAULT 0,
    visibleWeb     BIT              NOT NULL DEFAULT 1,
    visibleApp     BIT              NOT NULL DEFAULT 1,
    usuarios       NVARCHAR(300)    NULL, -- Códigos de usuario separados por coma; NULL = todos

    textoBoton     NVARCHAR(50)     NULL, -- Ej: "Ver más", "Comprar ahora"
    fechaInicio    DATETIME         NULL, -- Desde cuándo se muestra
    fechaFin       DATETIME         NULL, -- Hasta cuándo se muestra
    esExterno      BIT              NOT NULL DEFAULT 0, -- 1 = abre navegador, 0 = link interno

    activo         BIT              NOT NULL DEFAULT 1,
    created_at     DATETIME         NOT NULL DEFAULT GETDATE(),
    updated_at     DATETIME         NULL,
    deleted_at     DATETIME         NULL,

    CONSTRAINT PK_config_Carousel PRIMARY KEY (carouselId)
);
GO

-- Permisos del módulo (también los crea `npm run seed`).
IF NOT EXISTS (SELECT 1 FROM auth.Permiso WHERE codigo = 'CAROUSEL_CREAR')
    INSERT INTO auth.Permiso (id, codigo, modulo, accion, descripcion, activo, requires_auth)
    VALUES ('852662E6-8C37-40E1-AA7C-D85965F493B5', 'CAROUSEL_CREAR', 'Carousel', 'CREAR', 'Permite crear elementos del carrusel', 1, 0);

IF NOT EXISTS (SELECT 1 FROM auth.Permiso WHERE codigo = 'CAROUSEL_EDITAR')
    INSERT INTO auth.Permiso (id, codigo, modulo, accion, descripcion, activo, requires_auth)
    VALUES ('F627D50E-FFF1-49A9-9ADE-13C0DD6DB510', 'CAROUSEL_EDITAR', 'Carousel', 'EDITAR', 'Permite editar elementos del carrusel', 1, 0);

IF NOT EXISTS (SELECT 1 FROM auth.Permiso WHERE codigo = 'CAROUSEL_ELIMINAR')
    INSERT INTO auth.Permiso (id, codigo, modulo, accion, descripcion, activo, requires_auth)
    VALUES ('A8C581B4-F433-4474-89F5-B5EF0FD5A387', 'CAROUSEL_ELIMINAR', 'Carousel', 'ELIMINAR', 'Permite eliminar (soft-delete) elementos del carrusel', 1, 0);
GO
