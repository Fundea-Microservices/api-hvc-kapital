import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Jerarquía Módulo → Política para los parámetros generales (`Config`).
 *
 * Crea `auth.ConfigModulo` y `auth.ConfigPolitica` (esquema de `Config`) y
 * agrega `auth.config.politicaId` de forma segura sobre una tabla que ya
 * puede tener registros:
 *
 *   1. Crear tablas, índices y FK política → módulo.
 *   2. Agregar `politicaId` como NULL.
 *   3. Insertar módulo/política por defecto (`MOD_SISTEMA` →
 *      `POL_REGLAS_GENERALES`) si no existen.
 *   4. Asignar la política por defecto a los registros existentes.
 *   5. Endurecer a NOT NULL, indexar y crear la FK `Config` → política.
 *
 * Idempotente (IF OBJECT_ID / sys.columns / sys.indexes / sys.foreign_keys),
 * igual que el resto de migraciones del proyecto.
 */
export class CreateConfigModulosPoliticas1795200000000
  implements MigrationInterface
{
  name = 'CreateConfigModulosPoliticas1795200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Tablas ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[ConfigModulo]', 'U') IS NULL
      CREATE TABLE [auth].[ConfigModulo] (
        [id] uniqueidentifier NOT NULL DEFAULT newid(),
        [codigo] varchar(50) NOT NULL,
        [nombre] nvarchar(100) NOT NULL,
        [descripcion] nvarchar(255) NULL,
        [orden] int NOT NULL DEFAULT 0,
        [menuId] varchar(36) NULL,
        [activo] bit NOT NULL DEFAULT 1,
        [created_at] datetime2 NOT NULL DEFAULT getdate(),
        [updated_at] datetime2 NULL,
        [deleted_at] datetime2 NULL,
        CONSTRAINT [PK_auth_ConfigModulo] PRIMARY KEY ([id])
      );
    `);

    await queryRunner.query(`
      IF OBJECT_ID('[auth].[ConfigPolitica]', 'U') IS NULL
      CREATE TABLE [auth].[ConfigPolitica] (
        [id] uniqueidentifier NOT NULL DEFAULT newid(),
        [moduloId] uniqueidentifier NOT NULL,
        [codigo] varchar(50) NOT NULL,
        [nombre] nvarchar(100) NOT NULL,
        [descripcion] nvarchar(255) NULL,
        [orden] int NOT NULL DEFAULT 0,
        [activo] bit NOT NULL DEFAULT 1,
        [created_at] datetime2 NOT NULL DEFAULT getdate(),
        [updated_at] datetime2 NULL,
        [deleted_at] datetime2 NULL,
        CONSTRAINT [PK_auth_ConfigPolitica] PRIMARY KEY ([id])
      );
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_ConfigModulo_codigo'
          AND object_id = OBJECT_ID('[auth].[ConfigModulo]')
      )
      CREATE UNIQUE INDEX [UQ_ConfigModulo_codigo]
        ON [auth].[ConfigModulo] ([codigo])
        WHERE [deleted_at] IS NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_ConfigPolitica_codigo'
          AND object_id = OBJECT_ID('[auth].[ConfigPolitica]')
      )
      CREATE UNIQUE INDEX [UQ_ConfigPolitica_codigo]
        ON [auth].[ConfigPolitica] ([codigo])
        WHERE [deleted_at] IS NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_ConfigPolitica_moduloId'
          AND object_id = OBJECT_ID('[auth].[ConfigPolitica]')
      )
      CREATE INDEX [IX_ConfigPolitica_moduloId]
        ON [auth].[ConfigPolitica] ([moduloId]);
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_ConfigPolitica_ConfigModulo'
          AND parent_object_id = OBJECT_ID('[auth].[ConfigPolitica]')
      )
      ALTER TABLE [auth].[ConfigPolitica]
        ADD CONSTRAINT [FK_ConfigPolitica_ConfigModulo]
        FOREIGN KEY ([moduloId])
        REFERENCES [auth].[ConfigModulo] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    // ── 2. politicaId nullable ─────────────────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[auth].[config]') AND name = 'politicaId'
      )
        ALTER TABLE [auth].[config] ADD [politicaId] uniqueidentifier NULL;
    `);

    // ── 3. Módulo y política por defecto (idempotente por codigo) ──────────
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM [auth].[ConfigModulo] WHERE [codigo] = 'MOD_SISTEMA'
      )
      INSERT INTO [auth].[ConfigModulo]
        ([id], [codigo], [nombre], [descripcion], [orden], [activo])
      VALUES
        (NEWID(), 'MOD_SISTEMA', 'Sistema',
         'Parámetros generales del sistema', 6, 1);
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM [auth].[ConfigPolitica]
        WHERE [codigo] = 'POL_REGLAS_GENERALES'
      )
      INSERT INTO [auth].[ConfigPolitica]
        ([id], [moduloId], [codigo], [nombre], [descripcion], [orden], [activo])
      SELECT
        NEWID(), [id], 'POL_REGLAS_GENERALES', 'Reglas Generales',
        'Parámetros generales que no dependen de un módulo de negocio', 1, 1
      FROM [auth].[ConfigModulo]
      WHERE [codigo] = 'MOD_SISTEMA';
    `);

    // ── 4. Backfill de los parámetros existentes ───────────────────────────
    await queryRunner.query(`
      UPDATE [auth].[config]
      SET [politicaId] = (
        SELECT TOP 1 [id] FROM [auth].[ConfigPolitica]
        WHERE [codigo] = 'POL_REGLAS_GENERALES'
      )
      WHERE [politicaId] IS NULL;
    `);

    // ── 5. NOT NULL + índice + FK ──────────────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (SELECT 1 FROM [auth].[config] WHERE [politicaId] IS NULL)
        ALTER TABLE [auth].[config]
          ALTER COLUMN [politicaId] uniqueidentifier NOT NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_Config_politicaId'
          AND object_id = OBJECT_ID('[auth].[config]')
      )
      CREATE INDEX [IX_Config_politicaId]
        ON [auth].[config] ([politicaId]);
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_Config_ConfigPolitica'
          AND parent_object_id = OBJECT_ID('[auth].[config]')
      )
      ALTER TABLE [auth].[config]
        ADD CONSTRAINT [FK_Config_ConfigPolitica]
        FOREIGN KEY ([politicaId])
        REFERENCES [auth].[ConfigPolitica] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_Config_ConfigPolitica'
          AND parent_object_id = OBJECT_ID('[auth].[config]')
      )
        ALTER TABLE [auth].[config]
          DROP CONSTRAINT [FK_Config_ConfigPolitica];
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_Config_politicaId'
          AND object_id = OBJECT_ID('[auth].[config]')
      )
        DROP INDEX [IX_Config_politicaId] ON [auth].[config];
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID('[auth].[config]') AND name = 'politicaId'
      )
        ALTER TABLE [auth].[config] DROP COLUMN [politicaId];
    `);

    await queryRunner.query(`
      IF OBJECT_ID('[auth].[ConfigPolitica]', 'U') IS NOT NULL
        DROP TABLE [auth].[ConfigPolitica];
    `);

    await queryRunner.query(`
      IF OBJECT_ID('[auth].[ConfigModulo]', 'U') IS NOT NULL
        DROP TABLE [auth].[ConfigModulo];
    `);
  }
}
