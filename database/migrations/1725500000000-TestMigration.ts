import { MigrationInterface, QueryRunner } from 'typeorm';

export class TestMigration1725500000000 implements MigrationInterface {
  name = 'TestMigration1725500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE [auth].[MigrationTest] (
        [id] int IDENTITY(1,1) PRIMARY KEY,
        [mensaje] nvarchar(200) NOT NULL,
        [created_at] datetime DEFAULT getdate() NULL
      );
    `);

    await queryRunner.query(`
      INSERT INTO [auth].[MigrationTest] (mensaje)
      VALUES ('✅ Migración ejecutada correctamente — esta tabla es temporal');
    `);

    console.log('  ✅ Tabla [auth].[MigrationTest] creada con datos de prueba.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      IF OBJECT_ID('[auth].[MigrationTest]', 'U') IS NOT NULL
        DROP TABLE [auth].[MigrationTest];
    `);

    console.log('  🗑️  Tabla [auth].[MigrationTest] eliminada (revert).');
  }
}
