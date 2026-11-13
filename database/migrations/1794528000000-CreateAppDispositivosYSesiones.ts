import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema `app` de la aplicacion movil: dispositivos enrolados y sesiones.
 *
 * Idempotente (OBJECT_ID / COL_LENGTH / sys.indexes) porque estos objetos ya
 * existen en HvcKapital, creados a mano por los scripts del microservicio.
 */
export class CreateAppDispositivosYSesiones1794528000000 implements MigrationInterface {
  name = 'CreateAppDispositivosYSesiones1794528000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Schema ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'app')
        EXEC('CREATE SCHEMA app');
    `);

    // ── Columnas de la app en auth.Usuario ─────────────────────────────────
    // Se agregan como NULL: una tabla con filas no admite NOT NULL sin default.
    await queryRunner.query(`
      IF COL_LENGTH('auth.Usuario', 'CodigoEnrolamiento') IS NULL
        ALTER TABLE [auth].[Usuario] ADD [CodigoEnrolamiento] varchar(50) NULL;
    `);
    await queryRunner.query(`
      IF COL_LENGTH('auth.Usuario', 'RequiereCambioPassword') IS NULL
        ALTER TABLE [auth].[Usuario]
          ADD [RequiereCambioPassword] bit NOT NULL
          CONSTRAINT DF_Usuario_RequiereCambioPassword DEFAULT 0;
    `);
    await queryRunner.query(`
      IF COL_LENGTH('auth.Usuario', 'TipoUsuario') IS NULL
        ALTER TABLE [auth].[Usuario] ADD [TipoUsuario] varchar(50) NULL;
    `);

    // El codigo es una credencial: unico entre los que existen. El indice
    // filtrado deja que muchos usuarios no tengan codigo (NULL) sin chocar.
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'UX_Usuario_CodigoEnrolamiento'
          AND object_id = OBJECT_ID('[auth].[Usuario]')
      )
      CREATE UNIQUE INDEX UX_Usuario_CodigoEnrolamiento
        ON [auth].[Usuario] ([CodigoEnrolamiento])
        WHERE [CodigoEnrolamiento] IS NOT NULL;
    `);

    // ── app.Dispositivos ───────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[app].[Dispositivos]', 'U') IS NULL
      CREATE TABLE [app].[Dispositivos] (
        [IdDispositivo]     int IDENTITY(1,1) NOT NULL,
        [HardwareID]        varchar(100) NOT NULL,
        [DeviceToken]       varchar(255) NOT NULL,
        [IdUsuario]         uniqueidentifier NOT NULL,
        [Estado]            bit DEFAULT 1 NOT NULL,
        [Modelo]            nvarchar(100) NULL,
        [VersionSO]         nvarchar(50) NULL,
        [FechaIngreso]      datetime DEFAULT getdate() NOT NULL,
        [FechaModificacion] datetime DEFAULT getdate() NOT NULL,
        CONSTRAINT PK_app_Dispositivos PRIMARY KEY ([IdDispositivo]),
        CONSTRAINT UQ_app_Dispositivos_HardwareID UNIQUE ([HardwareID]),
        CONSTRAINT UQ_app_Dispositivos_DeviceToken UNIQUE ([DeviceToken])
      );
    `);

    // Columnas que pueden faltar si la tabla venia de una version anterior.
    await queryRunner.query(`
      IF COL_LENGTH('app.Dispositivos', 'Modelo') IS NULL
        ALTER TABLE [app].[Dispositivos] ADD [Modelo] nvarchar(100) NULL;
    `);
    await queryRunner.query(`
      IF COL_LENGTH('app.Dispositivos', 'VersionSO') IS NULL
        ALTER TABLE [app].[Dispositivos] ADD [VersionSO] nvarchar(50) NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Dispositivos_Usuario'
      )
      ALTER TABLE [app].[Dispositivos]
        ADD CONSTRAINT FK_Dispositivos_Usuario
        FOREIGN KEY ([IdUsuario]) REFERENCES [auth].[Usuario]([id]);
    `);

    // ── app.Sesiones ───────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[app].[Sesiones]', 'U') IS NULL
      CREATE TABLE [app].[Sesiones] (
        [IdSesion]        int IDENTITY(1,1) NOT NULL,
        [IdUsuario]       uniqueidentifier NOT NULL,
        [IdDispositivo]   int NOT NULL,
        [RefreshToken]    varchar(255) NULL,
        [FechaInicio]     datetime DEFAULT getdate() NOT NULL,
        [FechaExpiracion] datetime NULL,
        [Activa]          bit DEFAULT 1 NOT NULL,
        CONSTRAINT PK_app_Sesiones PRIMARY KEY ([IdSesion])
      );
    `);

    // Un UNIQUE normal trataria como iguales a todas las sesiones sin token:
    // el indice filtrado solo exige unicidad entre los tokens que existen.
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'UX_Sesiones_RefreshToken'
          AND object_id = OBJECT_ID('[app].[Sesiones]')
      )
      CREATE UNIQUE INDEX UX_Sesiones_RefreshToken
        ON [app].[Sesiones] ([RefreshToken])
        WHERE [RefreshToken] IS NOT NULL;
    `);
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'IX_Sesiones_Dispositivo_Activa'
          AND object_id = OBJECT_ID('[app].[Sesiones]')
      )
      CREATE INDEX IX_Sesiones_Dispositivo_Activa
        ON [app].[Sesiones] ([IdDispositivo], [Activa]);
    `);
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'IX_Sesiones_Usuario_Activa'
          AND object_id = OBJECT_ID('[app].[Sesiones]')
      )
      CREATE INDEX IX_Sesiones_Usuario_Activa
        ON [app].[Sesiones] ([IdUsuario], [Activa]);
    `);

    // ── Version minima de la app ───────────────────────────────────────────
    // Vivia en app.Cat_Parametros del microservicio; ahora la gobierna
    // auth.Config, que ya es el catalogo de parametros de esta API.
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM [auth].[Config] WHERE [llave] = 'VERSION_MINIMA_APP'
      )
      INSERT INTO [auth].[Config] ([llave], [valor], [tipo], [descripcion])
      VALUES ('VERSION_MINIMA_APP', '1.0.0', 'string',
              'Version minima de la app movil; por debajo se exige actualizar.');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM [auth].[Config] WHERE [llave] = 'VERSION_MINIMA_APP';`,
    );
    await queryRunner.query(
      `IF OBJECT_ID('[app].[Sesiones]', 'U') IS NOT NULL DROP TABLE [app].[Sesiones];`,
    );
    await queryRunner.query(`
      IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Dispositivos_Usuario')
        ALTER TABLE [app].[Dispositivos] DROP CONSTRAINT FK_Dispositivos_Usuario;
    `);
    await queryRunner.query(
      `IF OBJECT_ID('[app].[Dispositivos]', 'U') IS NOT NULL DROP TABLE [app].[Dispositivos];`,
    );
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes WHERE name = 'UX_Usuario_CodigoEnrolamiento'
          AND object_id = OBJECT_ID('[auth].[Usuario]')
      )
      DROP INDEX UX_Usuario_CodigoEnrolamiento ON [auth].[Usuario];
    `);
    await queryRunner.query(`
      IF COL_LENGTH('auth.Usuario', 'RequiereCambioPassword') IS NOT NULL
      BEGIN
        IF EXISTS (
          SELECT 1 FROM sys.default_constraints
          WHERE name = 'DF_Usuario_RequiereCambioPassword'
        )
          ALTER TABLE [auth].[Usuario]
            DROP CONSTRAINT DF_Usuario_RequiereCambioPassword;
        ALTER TABLE [auth].[Usuario] DROP COLUMN [RequiereCambioPassword];
      END
    `);
    await queryRunner.query(`
      IF COL_LENGTH('auth.Usuario', 'CodigoEnrolamiento') IS NOT NULL
        ALTER TABLE [auth].[Usuario] DROP COLUMN [CodigoEnrolamiento];
    `);
    await queryRunner.query(`
      IF COL_LENGTH('auth.Usuario', 'TipoUsuario') IS NOT NULL
        ALTER TABLE [auth].[Usuario] DROP COLUMN [TipoUsuario];
    `);
  }
}
