import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Configuración General Institucional (`config.ConfigGeneral`) y su bitácora
 * inmutable (`config.BitacoraConfigGeneral`).
 *
 * Reglas relevantes para SQL Server:
 * - `ConfigGeneral` es un singleton lógico: no se crea ninguna restricción
 *   calculada; el servicio rechaza un segundo registro (decisión de etapa).
 * - Las tres FKs hacia `DominioValor` y las dos de la bitácora usan
 *   ON DELETE / ON UPDATE NO ACTION para no introducir rutas de cascada.
 * - `BitacoraConfigGeneral.registroId` no lleva FK física (historial
 *   independiente del registro de configuración).
 * - Los snapshots JSON son nvarchar(MAX), no `text`.
 *
 * Idempotente (IF OBJECT_ID / sys.indexes / sys.foreign_keys), igual que el
 * resto de migraciones del proyecto.
 */
export class CreateConfigGeneral1795400000000 implements MigrationInterface {
  name = 'CreateConfigGeneral1795400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Esquema ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF SCHEMA_ID('config') IS NULL
        EXEC('CREATE SCHEMA [config]');
    `);

    // ── ConfigGeneral ──────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[config].[ConfigGeneral]', 'U') IS NULL
      CREATE TABLE [config].[ConfigGeneral] (
        [id] uniqueidentifier NOT NULL DEFAULT newid(),
        [codigoInterno] varchar(30) NOT NULL,
        [nombreComercial] nvarchar(150) NOT NULL,
        [codigoCasaCentral] uniqueidentifier NOT NULL,
        [pais] uniqueidentifier NOT NULL,
        [monedaPrincipal] uniqueidentifier NOT NULL,
        [fechaCierre] date NOT NULL,
        [fechaApertura] date NOT NULL,
        [cierreMensual] date NOT NULL,
        [nit] varchar(20) NOT NULL,
        [codigoSIB] varchar(30) NOT NULL,
        [registroMercadoValores] varchar(30) NOT NULL,
        [representanteLegal] nvarchar(150) NOT NULL,
        [dpiRepresentante] varchar(20) NOT NULL,
        [direccionFiscal] nvarchar(300) NOT NULL,
        [horaInicioOp] varchar(5) NOT NULL,
        [horaCierreOp] varchar(5) NOT NULL,
        [activo] bit NOT NULL DEFAULT 1,
        [created_at] datetime2 NOT NULL DEFAULT getdate(),
        [updated_at] datetime2 NULL,
        [deleted_at] datetime2 NULL,
        CONSTRAINT [PK_config_ConfigGeneral] PRIMARY KEY ([id])
      );
    `);

    // ── BitacoraConfigGeneral ──────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[config].[BitacoraConfigGeneral]', 'U') IS NULL
      CREATE TABLE [config].[BitacoraConfigGeneral] (
        [id] uniqueidentifier NOT NULL DEFAULT newid(),
        [registroId] uniqueidentifier NOT NULL,
        [accion] varchar(20) NOT NULL,
        [versionAnterior] nvarchar(MAX) NULL,
        [versionNueva] nvarchar(MAX) NULL,
        [camposModificados] nvarchar(MAX) NULL,
        [justificacion] nvarchar(500) NULL,
        [estacionIp] varchar(45) NULL,
        [usuarioId] uniqueidentifier NULL,
        [bitacoraAutorizacionId] uniqueidentifier NULL,
        [origen] varchar(30) NOT NULL DEFAULT 'API',
        [created_at] datetime2 NOT NULL DEFAULT getdate(),
        CONSTRAINT [PK_config_BitacoraConfigGeneral] PRIMARY KEY ([id])
      );
    `);

    // ── Índices ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_ConfigGeneral_codigoInterno'
          AND object_id = OBJECT_ID('[config].[ConfigGeneral]')
      )
      CREATE UNIQUE INDEX [UQ_ConfigGeneral_codigoInterno]
        ON [config].[ConfigGeneral] ([codigoInterno])
        WHERE [deleted_at] IS NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_ConfigGeneral_nit'
          AND object_id = OBJECT_ID('[config].[ConfigGeneral]')
      )
      CREATE UNIQUE INDEX [UQ_ConfigGeneral_nit]
        ON [config].[ConfigGeneral] ([nit])
        WHERE [deleted_at] IS NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_BitacoraConfigGeneral_created_at'
          AND object_id = OBJECT_ID('[config].[BitacoraConfigGeneral]')
      )
      CREATE INDEX [IX_BitacoraConfigGeneral_created_at]
        ON [config].[BitacoraConfigGeneral] ([created_at]);
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_BitacoraConfigGeneral_usuarioId'
          AND object_id = OBJECT_ID('[config].[BitacoraConfigGeneral]')
      )
      CREATE INDEX [IX_BitacoraConfigGeneral_usuarioId]
        ON [config].[BitacoraConfigGeneral] ([usuarioId]);
    `);

    // ── Llaves foráneas (todas NO ACTION) ──────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_ConfigGeneral_CasaCentral'
          AND parent_object_id = OBJECT_ID('[config].[ConfigGeneral]')
      )
      ALTER TABLE [config].[ConfigGeneral]
        ADD CONSTRAINT [FK_ConfigGeneral_CasaCentral]
        FOREIGN KEY ([codigoCasaCentral])
        REFERENCES [config].[DominioValor] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_ConfigGeneral_Pais'
          AND parent_object_id = OBJECT_ID('[config].[ConfigGeneral]')
      )
      ALTER TABLE [config].[ConfigGeneral]
        ADD CONSTRAINT [FK_ConfigGeneral_Pais]
        FOREIGN KEY ([pais])
        REFERENCES [config].[DominioValor] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_ConfigGeneral_Moneda'
          AND parent_object_id = OBJECT_ID('[config].[ConfigGeneral]')
      )
      ALTER TABLE [config].[ConfigGeneral]
        ADD CONSTRAINT [FK_ConfigGeneral_Moneda]
        FOREIGN KEY ([monedaPrincipal])
        REFERENCES [config].[DominioValor] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_BitacoraConfigGeneral_Usuario'
          AND parent_object_id = OBJECT_ID('[config].[BitacoraConfigGeneral]')
      )
      ALTER TABLE [config].[BitacoraConfigGeneral]
        ADD CONSTRAINT [FK_BitacoraConfigGeneral_Usuario]
        FOREIGN KEY ([usuarioId])
        REFERENCES [auth].[usuario] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_BitacoraConfigGeneral_BitacoraAutorizacion'
          AND parent_object_id = OBJECT_ID('[config].[BitacoraConfigGeneral]')
      )
      ALTER TABLE [config].[BitacoraConfigGeneral]
        ADD CONSTRAINT [FK_BitacoraConfigGeneral_BitacoraAutorizacion]
        FOREIGN KEY ([bitacoraAutorizacionId])
        REFERENCES [auth].[Bitacora_Autorizacion] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('[config].[BitacoraConfigGeneral]', 'U') IS NOT NULL
        DROP TABLE [config].[BitacoraConfigGeneral];
    `);

    await queryRunner.query(`
      IF OBJECT_ID('[config].[ConfigGeneral]', 'U') IS NOT NULL
        DROP TABLE [config].[ConfigGeneral];
    `);
  }
}
