import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega `auth.menu.tiposUsuario`: códigos de auth.TipoUsuario separados por
 * coma que pueden ver la opción (NULL = visible para todos los tipos).
 *
 * Mismo criterio que config.Carousel.tiposUsuario, para que la audiencia se
 * exprese igual en toda la plataforma. Idempotente (COL_LENGTH).
 */
export class AddTiposUsuarioToMenu1794600000000 implements MigrationInterface {
  name = 'AddTiposUsuarioToMenu1794600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF COL_LENGTH('auth.menu', 'tiposUsuario') IS NULL
        ALTER TABLE [auth].[menu] ADD [tiposUsuario] nvarchar(MAX) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF COL_LENGTH('auth.menu', 'tiposUsuario') IS NOT NULL
        ALTER TABLE [auth].[menu] DROP COLUMN [tiposUsuario];
    `);
  }
}
