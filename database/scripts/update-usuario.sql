USE [hvc-db];

BEGIN TRY
    BEGIN TRANSACTION;
        ALTER TABLE [auth].[Usuario]
        DROP COLUMN [estados];
    COMMIT TRANSACTION;
    PRINT 'Update de Usuario completado con éxito.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT 'Error detectado: ' + ERROR_MESSAGE();
END CATCH