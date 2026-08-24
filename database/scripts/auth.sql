USE [hvc-db];

BEGIN TRY
    BEGIN TRANSACTION;

    /* 1. Creación de la tabla de bitácora */
    IF OBJECT_ID('[auth].[Bitacora_Autorizacion]', 'U') IS NULL
    BEGIN
        CREATE TABLE [auth].[Bitacora_Autorizacion] (
            [id] uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
            [endpoint] nvarchar(100) NOT NULL,
            [body_request] nvarchar(MAX) NOT NULL,
            [solicitanteId] uniqueidentifier NOT NULL,
            [autorizadorId] uniqueidentifier NOT NULL,
            [permisoId] uniqueidentifier NOT NULL,
            [created_at] DATETIME DEFAULT GETDATE()
        );

        ALTER TABLE [auth].[Bitacora_Autorizacion] 
            ADD CONSTRAINT [bit_auth_solicitante] FOREIGN KEY ([solicitanteId]) REFERENCES [auth].[Usuario] ([id]);
            
        ALTER TABLE [auth].[Bitacora_Autorizacion] 
            ADD CONSTRAINT [bit_auth_autorizador] FOREIGN KEY ([autorizadorId]) REFERENCES [auth].[Usuario] ([id]);
            
        ALTER TABLE [auth].[Bitacora_Autorizacion] 
            ADD CONSTRAINT [bit_auth_permiso] FOREIGN KEY ([permisoId]) REFERENCES [auth].[Permiso] ([id]);
    END

    /* 2. Agregar columnas a Usuario */
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[auth].[Usuario]') AND name = 'auth_code')
    BEGIN
        ALTER TABLE [auth].[Usuario] ADD [auth_code] nvarchar(10) NULL;
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[auth].[Usuario]') AND name = 'autoriza')
    BEGIN
        ALTER TABLE [auth].[Usuario] ADD [autoriza] BIT NOT NULL DEFAULT (0);
    END

    /* 3. Crear Índice Único Filtrado usando SQL Dinámico para evitar el error de compilación */
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Usuario_auth_code' AND object_id = OBJECT_ID('[auth].[Usuario]'))
    BEGIN
        EXEC('CREATE UNIQUE INDEX [UQ_Usuario_auth_code] 
              ON [auth].[Usuario]([auth_code]) 
              WHERE [auth_code] IS NOT NULL;');
    END

    /* 4. Campos en las demás tablas */
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[auth].[Permiso_Usuario]') AND name = 'autoriza')
        ALTER TABLE [auth].[Permiso_Usuario] ADD [autoriza] BIT NOT NULL DEFAULT (0);

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[auth].[Permiso_Rol]') AND name = 'autoriza')
        ALTER TABLE [auth].[Permiso_Rol] ADD [autoriza] BIT NOT NULL DEFAULT (0);

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[auth].[Permiso]') AND name = 'requires_auth')
        ALTER TABLE [auth].[Permiso] ADD [requires_auth] BIT NOT NULL DEFAULT (0);
    
    COMMIT TRANSACTION;
    PRINT 'Migración completada con éxito.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT 'Error detectado: ' + ERROR_MESSAGE();
END CATCH