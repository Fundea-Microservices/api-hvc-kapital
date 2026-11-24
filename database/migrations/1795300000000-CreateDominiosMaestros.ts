import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Dominios Maestros (Dominio, DominioValor, DominioRelacion) en el esquema
 * `config`, en reemplazo de los anteriores CatálogoTipo / CatalogoItem /
 * CatalogoRelacion.
 *
 * Estrategia (decisión de la etapa): migración limpia sin datos. Las tablas
 * anteriores se eliminan y las nuevas se crean vacías; los datos base se
 * cargan con `database/seeds/main.seed.ts`. Las migraciones históricas
 * 1795000000000 y 1795100000000 se conservan intactas porque ya pudieron
 * ejecutarse en entornos compartidos.
 *
 * Reglas relevantes para SQL Server:
 * - Todas las FKs usan ON DELETE / ON UPDATE NO ACTION. SQL Server rechaza
 *   cascadas múltiples desde DominioValor (padreId + DominioRelacion) y
 *   ciclos en la auto-referencia `padreId`.
 * - Los índices únicos son filtrados (`WHERE deleted_at IS NULL`) para que un
 *   código pueda reutilizarse después de un borrado lógico.
 * - Las columnas JSON son nvarchar(MAX); ISJSON se valida en la capa de
 *   servicio para no acoplar la BD a la versión del motor.
 *
 * Idempotente (IF OBJECT_ID / SCHEMA_ID / sys.indexes / sys.foreign_keys),
 * igual que el resto de migraciones del proyecto.
 */
export class CreateDominiosMaestros1795300000000
  implements MigrationInterface
{
  name = 'CreateDominiosMaestros1795300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Esquema ────────────────────────────────────────────────────────────
    // Las tablas viven en `config` junto a Carousel; el esquema ya existe por
    // migraciones previas, pero se crea si la base viene vacía.
    await queryRunner.query(`
      IF SCHEMA_ID('config') IS NULL
        EXEC('CREATE SCHEMA [config]');
    `);

    // ── Retirar el esquema anterior de catálogos (sin datos) ───────────────
    await queryRunner.query(`
      IF OBJECT_ID('[config].[CatalogoRelacion]', 'U') IS NOT NULL
        DROP TABLE [config].[CatalogoRelacion];
    `);

    await queryRunner.query(`
      IF OBJECT_ID('[config].[CatalogoItem]', 'U') IS NOT NULL
        DROP TABLE [config].[CatalogoItem];
    `);

    await queryRunner.query(`
      IF OBJECT_ID('[config].[CatalogoTipo]', 'U') IS NOT NULL
        DROP TABLE [config].[CatalogoTipo];
    `);

    // ── Dominio ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[config].[Dominio]', 'U') IS NULL
      CREATE TABLE [config].[Dominio] (
        [id] uniqueidentifier NOT NULL DEFAULT newid(),
        [codigo] nvarchar(50) NOT NULL,
        [nombre] nvarchar(100) NOT NULL,
        [descripcion] nvarchar(255) NULL,
        [permiteJerarquia] bit NOT NULL DEFAULT 0,
        [esquemaAtributos] nvarchar(MAX) NULL,
        [activo] bit NOT NULL DEFAULT 1,
        [created_at] datetime2 NOT NULL DEFAULT getdate(),
        [updated_at] datetime2 NULL,
        [deleted_at] datetime2 NULL,
        CONSTRAINT [PK_config_Dominio] PRIMARY KEY ([id])
      );
    `);

    // ── DominioValor ───────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[config].[DominioValor]', 'U') IS NULL
      CREATE TABLE [config].[DominioValor] (
        [id] uniqueidentifier NOT NULL DEFAULT newid(),
        [dominioId] uniqueidentifier NOT NULL,
        [padreId] uniqueidentifier NULL,
        [codigo] nvarchar(50) NOT NULL,
        [nombre] nvarchar(150) NOT NULL,
        [valor] nvarchar(255) NOT NULL,
        [ordenMenu] int NOT NULL DEFAULT 0,
        [atributos] nvarchar(MAX) NULL,
        [activo] bit NOT NULL DEFAULT 1,
        [created_at] datetime2 NOT NULL DEFAULT getdate(),
        [updated_at] datetime2 NULL,
        [deleted_at] datetime2 NULL,
        CONSTRAINT [PK_config_DominioValor] PRIMARY KEY ([id])
      );
    `);

    // ── DominioRelacion ────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[config].[DominioRelacion]', 'U') IS NULL
      CREATE TABLE [config].[DominioRelacion] (
        [id] uniqueidentifier NOT NULL DEFAULT newid(),
        [valorOrigenId] uniqueidentifier NOT NULL,
        [valorDestinoId] uniqueidentifier NOT NULL,
        [tipoRelacion] nvarchar(50) NOT NULL,
        [atributos] nvarchar(MAX) NULL,
        [activo] bit NOT NULL DEFAULT 1,
        [created_at] datetime2 NOT NULL DEFAULT getdate(),
        [updated_at] datetime2 NULL,
        [deleted_at] datetime2 NULL,
        CONSTRAINT [PK_config_DominioRelacion] PRIMARY KEY ([id])
      );
    `);

    // ── Índices ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_Dominio_codigo'
          AND object_id = OBJECT_ID('[config].[Dominio]')
      )
      CREATE UNIQUE INDEX [UQ_Dominio_codigo]
        ON [config].[Dominio] ([codigo])
        WHERE [deleted_at] IS NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_DominioValor_Dominio_Codigo'
          AND object_id = OBJECT_ID('[config].[DominioValor]')
      )
      CREATE UNIQUE INDEX [UQ_DominioValor_Dominio_Codigo]
        ON [config].[DominioValor] ([dominioId], [codigo])
        WHERE [deleted_at] IS NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_DominioValor_Padre'
          AND object_id = OBJECT_ID('[config].[DominioValor]')
      )
      CREATE INDEX [IX_DominioValor_Padre]
        ON [config].[DominioValor] ([padreId]);
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_DominioValor_Dominio_Activo'
          AND object_id = OBJECT_ID('[config].[DominioValor]')
      )
      CREATE INDEX [IX_DominioValor_Dominio_Activo]
        ON [config].[DominioValor] ([dominioId], [activo], [ordenMenu]);
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_DominioRelacion_Unica'
          AND object_id = OBJECT_ID('[config].[DominioRelacion]')
      )
      CREATE UNIQUE INDEX [UQ_DominioRelacion_Unica]
        ON [config].[DominioRelacion] ([valorOrigenId], [valorDestinoId], [tipoRelacion])
        WHERE [deleted_at] IS NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_DominioRelacion_Origen_Tipo'
          AND object_id = OBJECT_ID('[config].[DominioRelacion]')
      )
      CREATE INDEX [IX_DominioRelacion_Origen_Tipo]
        ON [config].[DominioRelacion] ([valorOrigenId], [tipoRelacion], [activo]);
    `);

    // ── Llaves foráneas (todas NO ACTION) ──────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_DominioValor_Dominio'
          AND parent_object_id = OBJECT_ID('[config].[DominioValor]')
      )
      ALTER TABLE [config].[DominioValor]
        ADD CONSTRAINT [FK_DominioValor_Dominio]
        FOREIGN KEY ([dominioId])
        REFERENCES [config].[Dominio] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_DominioValor_Padre'
          AND parent_object_id = OBJECT_ID('[config].[DominioValor]')
      )
      ALTER TABLE [config].[DominioValor]
        ADD CONSTRAINT [FK_DominioValor_Padre]
        FOREIGN KEY ([padreId])
        REFERENCES [config].[DominioValor] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_DominioRelacion_ValorOrigen'
          AND parent_object_id = OBJECT_ID('[config].[DominioRelacion]')
      )
      ALTER TABLE [config].[DominioRelacion]
        ADD CONSTRAINT [FK_DominioRelacion_ValorOrigen]
        FOREIGN KEY ([valorOrigenId])
        REFERENCES [config].[DominioValor] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_DominioRelacion_ValorDestino'
          AND parent_object_id = OBJECT_ID('[config].[DominioRelacion]')
      )
      ALTER TABLE [config].[DominioRelacion]
        ADD CONSTRAINT [FK_DominioRelacion_ValorDestino]
        FOREIGN KEY ([valorDestinoId])
        REFERENCES [config].[DominioValor] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Retirar las tablas nuevas ──────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[config].[DominioRelacion]', 'U') IS NOT NULL
        DROP TABLE [config].[DominioRelacion];
    `);

    await queryRunner.query(`
      IF OBJECT_ID('[config].[DominioValor]', 'U') IS NOT NULL
        DROP TABLE [config].[DominioValor];
    `);

    await queryRunner.query(`
      IF OBJECT_ID('[config].[Dominio]', 'U') IS NOT NULL
        DROP TABLE [config].[Dominio];
    `);

    // ── Restaurar el esquema anterior de catálogos (vacío) ─────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[config].[CatalogoTipo]', 'U') IS NULL
      CREATE TABLE [config].[CatalogoTipo] (
        [id] uniqueidentifier NOT NULL DEFAULT newid(),
        [codigo] nvarchar(50) NOT NULL,
        [nombre] nvarchar(100) NOT NULL,
        [descripcion] nvarchar(255) NULL,
        [permiteJerarquia] bit NOT NULL DEFAULT 0,
        [esquemaAtributos] nvarchar(MAX) NULL,
        [activo] bit NOT NULL DEFAULT 1,
        [created_at] datetime2 NOT NULL DEFAULT getdate(),
        [updated_at] datetime2 NULL,
        [deleted_at] datetime2 NULL,
        CONSTRAINT [PK_config_CatalogoTipo] PRIMARY KEY ([id])
      );
    `);

    await queryRunner.query(`
      IF OBJECT_ID('[config].[CatalogoItem]', 'U') IS NULL
      CREATE TABLE [config].[CatalogoItem] (
        [id] uniqueidentifier NOT NULL DEFAULT newid(),
        [catalogoTipoId] uniqueidentifier NOT NULL,
        [padreId] uniqueidentifier NULL,
        [codigo] nvarchar(50) NOT NULL,
        [nombre] nvarchar(150) NOT NULL,
        [valor] nvarchar(255) NOT NULL,
        [orden] int NOT NULL DEFAULT 0,
        [atributos] nvarchar(MAX) NULL,
        [activo] bit NOT NULL DEFAULT 1,
        [created_at] datetime2 NOT NULL DEFAULT getdate(),
        [updated_at] datetime2 NULL,
        [deleted_at] datetime2 NULL,
        CONSTRAINT [PK_config_CatalogoItem] PRIMARY KEY ([id])
      );
    `);

    await queryRunner.query(`
      IF OBJECT_ID('[config].[CatalogoRelacion]', 'U') IS NULL
      CREATE TABLE [config].[CatalogoRelacion] (
        [id] uniqueidentifier NOT NULL DEFAULT newid(),
        [itemOrigenId] uniqueidentifier NOT NULL,
        [itemDestinoId] uniqueidentifier NOT NULL,
        [tipoRelacion] nvarchar(50) NOT NULL,
        [atributos] nvarchar(MAX) NULL,
        [activo] bit NOT NULL DEFAULT 1,
        [created_at] datetime2 NOT NULL DEFAULT getdate(),
        [updated_at] datetime2 NULL,
        [deleted_at] datetime2 NULL,
        CONSTRAINT [PK_config_CatalogoRelacion] PRIMARY KEY ([id])
      );
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_CatalogoTipo_codigo'
          AND object_id = OBJECT_ID('[config].[CatalogoTipo]')
      )
      CREATE UNIQUE INDEX [UQ_CatalogoTipo_codigo]
        ON [config].[CatalogoTipo] ([codigo])
        WHERE [deleted_at] IS NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_CatalogoItem_Tipo_Codigo'
          AND object_id = OBJECT_ID('[config].[CatalogoItem]')
      )
      CREATE UNIQUE INDEX [UQ_CatalogoItem_Tipo_Codigo]
        ON [config].[CatalogoItem] ([catalogoTipoId], [codigo])
        WHERE [deleted_at] IS NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_CatalogoRelacion_Unica'
          AND object_id = OBJECT_ID('[config].[CatalogoRelacion]')
      )
      CREATE UNIQUE INDEX [UQ_CatalogoRelacion_Unica]
        ON [config].[CatalogoRelacion] ([itemOrigenId], [itemDestinoId], [tipoRelacion])
        WHERE [deleted_at] IS NULL;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_CatalogoItem_CatalogoTipo'
          AND parent_object_id = OBJECT_ID('[config].[CatalogoItem]')
      )
      ALTER TABLE [config].[CatalogoItem]
        ADD CONSTRAINT [FK_CatalogoItem_CatalogoTipo]
        FOREIGN KEY ([catalogoTipoId])
        REFERENCES [config].[CatalogoTipo] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_CatalogoItem_Padre'
          AND parent_object_id = OBJECT_ID('[config].[CatalogoItem]')
      )
      ALTER TABLE [config].[CatalogoItem]
        ADD CONSTRAINT [FK_CatalogoItem_Padre]
        FOREIGN KEY ([padreId])
        REFERENCES [config].[CatalogoItem] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_CatalogoRelacion_ItemOrigen'
          AND parent_object_id = OBJECT_ID('[config].[CatalogoRelacion]')
      )
      ALTER TABLE [config].[CatalogoRelacion]
        ADD CONSTRAINT [FK_CatalogoRelacion_ItemOrigen]
        FOREIGN KEY ([itemOrigenId])
        REFERENCES [config].[CatalogoItem] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_CatalogoRelacion_ItemDestino'
          AND parent_object_id = OBJECT_ID('[config].[CatalogoRelacion]')
      )
      ALTER TABLE [config].[CatalogoRelacion]
        ADD CONSTRAINT [FK_CatalogoRelacion_ItemDestino]
        FOREIGN KEY ([itemDestinoId])
        REFERENCES [config].[CatalogoItem] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    // El esquema `config` es compartido con Carousel: no se elimina.
  }
}
