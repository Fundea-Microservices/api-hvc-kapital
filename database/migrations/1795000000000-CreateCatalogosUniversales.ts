import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catálogos Maestros / Universales (CatalogoTipo, CatalogoItem,
 * CatalogoRelacion) en el esquema `config`, junto a `Carousel`.
 *
 * Reglas relevantes para SQL Server:
 * - Todas las FKs usan ON DELETE / ON UPDATE NO ACTION. SQL Server rechaza
 *   cascadas múltiples desde CatalogoItem (padreId + CatalogoRelacion) y
 *   ciclos en la auto-referencia `padreId`.
 * - Los índices únicos son filtrados (`WHERE deleted_at IS NULL`) para que un
 *   código pueda reutilizarse después de un borrado lógico.
 * - Las columnas JSON son nvarchar(MAX); ISJSON se valida en la capa de
 *   servicio para no acoplar la BD a la versión del motor.
 *
 * Idempotente (IF OBJECT_ID / SCHEMA_ID / sys.indexes / sys.foreign_keys),
 * igual que el resto de migraciones del proyecto.
 */
export class CreateCatalogosUniversales1795000000000
  implements MigrationInterface
{
  name = 'CreateCatalogosUniversales1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Esquema ────────────────────────────────────────────────────────────
    // Las tablas viven en `config` junto a Carousel; el esquema ya existe por
    // migraciones previas, pero se crea si la base viene vacía.
    await queryRunner.query(`
      IF SCHEMA_ID('config') IS NULL
        EXEC('CREATE SCHEMA [config]');
    `);

    // ── CatalogoTipo ───────────────────────────────────────────────────────
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

    // ── CatalogoItem ───────────────────────────────────────────────────────
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

    // ── CatalogoRelacion ───────────────────────────────────────────────────
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

    // ── Índices ────────────────────────────────────────────────────────────
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
        WHERE name = 'IX_CatalogoItem_Padre'
          AND object_id = OBJECT_ID('[config].[CatalogoItem]')
      )
      CREATE INDEX [IX_CatalogoItem_Padre]
        ON [config].[CatalogoItem] ([padreId]);
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_CatalogoItem_Tipo_Activo'
          AND object_id = OBJECT_ID('[config].[CatalogoItem]')
      )
      CREATE INDEX [IX_CatalogoItem_Tipo_Activo]
        ON [config].[CatalogoItem] ([catalogoTipoId], [activo], [orden]);
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
        SELECT 1 FROM sys.indexes
        WHERE name = 'IX_CatalogoRelacion_Origen_Tipo'
          AND object_id = OBJECT_ID('[config].[CatalogoRelacion]')
      )
      CREATE INDEX [IX_CatalogoRelacion_Origen_Tipo]
        ON [config].[CatalogoRelacion] ([itemOrigenId], [tipoRelacion], [activo]);
    `);

    // ── Llaves foráneas (todas NO ACTION) ──────────────────────────────────
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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

    // El esquema `config` es compartido con Carousel: no se elimina.
  }
}
