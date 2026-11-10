import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - Crea el catálogo `auth.TipoUsuario` (INVERSOR, EMPLEADO, ...).
 * - Agrega `config.Carousel.tiposUsuario`: códigos de auth.TipoUsuario
 *   separados por coma que pueden ver el elemento (NULL = sin filtro por tipo).
 *
 * Idempotente (IF NOT EXISTS / OBJECT_ID / COL_LENGTH), igual que las demás,
 * para poder convivir con el script manual database/scripts/tipo-usuario.sql.
 */
export class CreateTipoUsuarioAndCarouselTiposUsuario1759900000000 implements MigrationInterface {
  name = 'CreateTipoUsuarioAndCarouselTiposUsuario1759900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── TipoUsuario ────────────────────────────────────────────────────────
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[TipoUsuario]', 'U') IS NULL
      CREATE TABLE [auth].[TipoUsuario] (
        [id] uniqueidentifier DEFAULT newid() NOT NULL,
        [codigo] varchar(50) NOT NULL,
        [nombre] varchar(100) NOT NULL,
        [descripcion] varchar(500) NULL,
        [activo] bit DEFAULT 1 NOT NULL,
        [created_at] datetime DEFAULT getdate() NOT NULL,
        [updated_at] datetime NULL,
        [deleted_at] datetime NULL,
        CONSTRAINT PK_auth_TipoUsuario PRIMARY KEY (id)
      );
    `);

    // Código único solo entre los no eliminados: un código borrado
    // (soft-delete) se puede volver a crear.
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'UQ_auth_TipoUsuario_codigo'
          AND object_id = OBJECT_ID('[auth].[TipoUsuario]')
      )
      CREATE UNIQUE INDEX UQ_auth_TipoUsuario_codigo
        ON [auth].[TipoUsuario] ([codigo])
        WHERE [deleted_at] IS NULL;
    `);

    // ── Carousel.tiposUsuario ──────────────────────────────────────────────
    await queryRunner.query(`
      IF COL_LENGTH('config.Carousel', 'tiposUsuario') IS NULL
        ALTER TABLE [config].[Carousel] ADD [tiposUsuario] nvarchar(MAX) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF COL_LENGTH('config.Carousel', 'tiposUsuario') IS NOT NULL
        ALTER TABLE [config].[Carousel] DROP COLUMN [tiposUsuario];
    `);
    await queryRunner.query(
      `IF OBJECT_ID('[auth].[TipoUsuario]', 'U') IS NOT NULL DROP TABLE [auth].[TipoUsuario];`,
    );
  }
}
