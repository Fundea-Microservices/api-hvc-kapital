import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mueve las tablas de Catálogos Universales del esquema `catalogos` al
 * esquema `config`, junto a `Carousel`.
 *
 * La migración de creación ya apunta a `config`; esta se encarga de las bases
 * donde las tablas se crearon con el esquema anterior. Es idempotente: si las
 * tablas todavía están en `catalogos` las transfiere, y si ya están en `config`
 * no hace nada.
 *
 * SQL Server no permite mover un esquema con FKs apuntando entre tablas de los
 * dos esquemas de forma segura, así que se eliminan las cuatro FKs, se
 * transfieren las tablas y se recrean apuntando a `config`. Las PK se renombran
 * de `PK_catalogos_*` a `PK_config_*` para mantener la convención.
 */
export class MoveCatalogosToConfigSchema1795100000000
  implements MigrationInterface
{
  name = 'MoveCatalogosToConfigSchema1795100000000';

  private readonly tablas = ['CatalogoRelacion', 'CatalogoItem', 'CatalogoTipo'];

  private readonly fks: Array<{
    constraint: string;
    tabla: string;
    columna: string;
    referencia: string;
  }> = [
    {
      constraint: 'FK_CatalogoItem_CatalogoTipo',
      tabla: 'CatalogoItem',
      columna: 'catalogoTipoId',
      referencia: 'CatalogoTipo',
    },
    {
      constraint: 'FK_CatalogoItem_Padre',
      tabla: 'CatalogoItem',
      columna: 'padreId',
      referencia: 'CatalogoItem',
    },
    {
      constraint: 'FK_CatalogoRelacion_ItemOrigen',
      tabla: 'CatalogoRelacion',
      columna: 'itemOrigenId',
      referencia: 'CatalogoItem',
    },
    {
      constraint: 'FK_CatalogoRelacion_ItemDestino',
      tabla: 'CatalogoRelacion',
      columna: 'itemDestinoId',
      referencia: 'CatalogoItem',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Esquema destino ────────────────────────────────────────────────────
    await queryRunner.query(`
      IF SCHEMA_ID('config') IS NULL
        EXEC('CREATE SCHEMA [config]');
    `);

    // ── Quitar FKs del esquema origen antes de mover ───────────────────────
    for (const fk of this.fks) {
      await queryRunner.query(`
        IF EXISTS (
          SELECT 1 FROM sys.foreign_keys
          WHERE name = '${fk.constraint}'
            AND parent_object_id = OBJECT_ID('[catalogos].[${fk.tabla}]')
        )
          ALTER TABLE [catalogos].[${fk.tabla}]
            DROP CONSTRAINT [${fk.constraint}];
      `);
    }

    // ── Transferir tablas ─────────────────────────────────────────────────
    for (const tabla of this.tablas) {
      await queryRunner.query(`
        IF OBJECT_ID('[catalogos].[${tabla}]', 'U') IS NOT NULL
           AND OBJECT_ID('[config].[${tabla}]', 'U') IS NULL
          ALTER SCHEMA [config] TRANSFER [catalogos].[${tabla}];
      `);
    }

    // ── Renombrar PKs para la convención del esquema config ───────────────
    for (const tabla of [...this.tablas].reverse()) {
      await queryRunner.query(`
        IF OBJECT_ID('[config].[PK_catalogos_${tabla}]') IS NOT NULL
           AND OBJECT_ID('[config].[PK_config_${tabla}]') IS NULL
          EXEC sp_rename
            N'[config].[PK_catalogos_${tabla}]',
            N'PK_config_${tabla}',
            N'OBJECT';
      `);
    }

    // ── Recrear FKs apuntando a config ─────────────────────────────────────
    for (const fk of this.fks) {
      await queryRunner.query(`
        IF OBJECT_ID('[config].[${fk.tabla}]', 'U') IS NOT NULL
           AND OBJECT_ID('[config].[${fk.referencia}]', 'U') IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM sys.foreign_keys
             WHERE name = '${fk.constraint}'
               AND parent_object_id = OBJECT_ID('[config].[${fk.tabla}]')
           )
          ALTER TABLE [config].[${fk.tabla}]
            ADD CONSTRAINT [${fk.constraint}]
            FOREIGN KEY ([${fk.columna}])
            REFERENCES [config].[${fk.referencia}] ([id])
            ON DELETE NO ACTION ON UPDATE NO ACTION;
      `);
    }

    // ── Eliminar el esquema origen si quedó vacío ──────────────────────────
    await queryRunner.query(`
      IF SCHEMA_ID('catalogos') IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM sys.objects
           WHERE schema_id = SCHEMA_ID('catalogos')
         )
        EXEC('DROP SCHEMA [catalogos]');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── Esquema origen ─────────────────────────────────────────────────────
    await queryRunner.query(`
      IF SCHEMA_ID('catalogos') IS NULL
        EXEC('CREATE SCHEMA [catalogos]');
    `);

    // ── Quitar FKs del esquema config antes de mover ───────────────────────
    for (const fk of this.fks) {
      await queryRunner.query(`
        IF EXISTS (
          SELECT 1 FROM sys.foreign_keys
          WHERE name = '${fk.constraint}'
            AND parent_object_id = OBJECT_ID('[config].[${fk.tabla}]')
        )
          ALTER TABLE [config].[${fk.tabla}]
            DROP CONSTRAINT [${fk.constraint}];
      `);
    }

    // ── Devolver tablas a catalogos ────────────────────────────────────────
    for (const tabla of this.tablas) {
      await queryRunner.query(`
        IF OBJECT_ID('[config].[${tabla}]', 'U') IS NOT NULL
           AND OBJECT_ID('[catalogos].[${tabla}]', 'U') IS NULL
          ALTER SCHEMA [catalogos] TRANSFER [config].[${tabla}];
      `);
    }

    // ── Restaurar nombres de PK ────────────────────────────────────────────
    for (const tabla of [...this.tablas].reverse()) {
      await queryRunner.query(`
        IF OBJECT_ID('[catalogos].[PK_config_${tabla}]') IS NOT NULL
           AND OBJECT_ID('[catalogos].[PK_catalogos_${tabla}]') IS NULL
          EXEC sp_rename
            N'[catalogos].[PK_config_${tabla}]',
            N'PK_catalogos_${tabla}',
            N'OBJECT';
      `);
    }

    // ── Recrear FKs apuntando a catalogos ──────────────────────────────────
    for (const fk of this.fks) {
      await queryRunner.query(`
        IF OBJECT_ID('[catalogos].[${fk.tabla}]', 'U') IS NOT NULL
           AND OBJECT_ID('[catalogos].[${fk.referencia}]', 'U') IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM sys.foreign_keys
             WHERE name = '${fk.constraint}'
               AND parent_object_id = OBJECT_ID('[catalogos].[${fk.tabla}]')
           )
          ALTER TABLE [catalogos].[${fk.tabla}]
            ADD CONSTRAINT [${fk.constraint}]
            FOREIGN KEY ([${fk.columna}])
            REFERENCES [catalogos].[${fk.referencia}] ([id])
            ON DELETE NO ACTION ON UPDATE NO ACTION;
      `);
    }
  }
}
