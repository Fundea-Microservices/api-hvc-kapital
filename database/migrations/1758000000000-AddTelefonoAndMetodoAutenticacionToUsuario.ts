import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTelefonoAndMetodoAutenticacionToUsuario1758000000000
  implements MigrationInterface
{
  name = 'AddTelefonoAndMetodoAutenticacionToUsuario1758000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna telefono (nullable, sin default — registros existentes quedan NULL)
    await queryRunner.addColumn(
      'auth.usuario',
      new TableColumn({
        name: 'telefono',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );

    // Agregar columna metodoAutenticacion (nullable, default 'Local')
    await queryRunner.addColumn(
      'auth.usuario',
      new TableColumn({
        name: 'metodoAutenticacion',
        type: 'varchar',
        length: '50',
        isNullable: true,
        default: "'Local'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('auth.usuario', 'metodoAutenticacion');
    await queryRunner.dropColumn('auth.usuario', 'telefono');
  }
}
