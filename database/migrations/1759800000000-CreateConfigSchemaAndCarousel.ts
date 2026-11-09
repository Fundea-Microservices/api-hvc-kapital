import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea el esquema `config` y la tabla `config.Carousel`.
 *
 * Idempotente (IF NOT EXISTS / OBJECT_ID), igual que InitialSchema, para
 * poder convivir con el script manual database/scripts/config-carousel.sql.
 */
export class CreateConfigSchemaAndCarousel1759800000000
  implements MigrationInterface
{
  name = 'CreateConfigSchemaAndCarousel1759800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Schema ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'config')
        EXEC('CREATE SCHEMA config');
    `);

    // ── Carousel ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[config].[Carousel]', 'U') IS NULL
      CREATE TABLE [config].[Carousel] (
        [carouselId] uniqueidentifier DEFAULT newid() NOT NULL,
        [titulo] nvarchar(200) NOT NULL,
        [subtitulo] nvarchar(200) NULL,
        [codigo] nvarchar(20) NULL,
        [descripcion] nvarchar(MAX) NULL,
        [fotoUrl] nvarchar(MAX) NOT NULL,
        [redireccionUrl] nvarchar(MAX) NULL,
        [orden] int DEFAULT 0 NOT NULL,
        [visibleWeb] bit DEFAULT 1 NOT NULL,
        [visibleApp] bit DEFAULT 1 NOT NULL,
        [usuarios] nvarchar(300) NULL,
        [textoBoton] nvarchar(50) NULL,
        [fechaInicio] datetime NULL,
        [fechaFin] datetime NULL,
        [esExterno] bit DEFAULT 0 NOT NULL,
        [activo] bit DEFAULT 1 NOT NULL,
        [created_at] datetime DEFAULT getdate() NOT NULL,
        [updated_at] datetime NULL,
        [deleted_at] datetime NULL,
        CONSTRAINT PK_config_Carousel PRIMARY KEY (carouselId)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `IF OBJECT_ID('[config].[Carousel]', 'U') IS NOT NULL DROP TABLE [config].[Carousel];`,
    );
    // Solo se elimina el esquema si quedó vacío (otras tablas pueden usarlo).
    await queryRunner.query(`
      IF EXISTS (SELECT * FROM sys.schemas WHERE name = 'config')
        AND NOT EXISTS (SELECT * FROM sys.objects WHERE schema_id = SCHEMA_ID('config'))
        EXEC('DROP SCHEMA config');
    `);
  }
}
