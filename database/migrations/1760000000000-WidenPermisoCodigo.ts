import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Amplía `auth.Permiso.codigo` de nvarchar(20) a nvarchar(50).
 * Códigos como 'TIPO_USUARIO_ELIMINAR' (21 caracteres) no cabían y el seed
 * fallaba con "Data type 0xE7 has an invalid data length".
 *
 * La restricción UNIQUE sobre `codigo` tiene nombre autogenerado
 * (UQ__Permiso__...) que puede variar entre ambientes, así que se busca
 * dinámicamente, se elimina, se altera la columna y se recrea con nombre fijo.
 *
 * Idempotente: si la columna ya mide 50, no hace nada.
 */
export class WidenPermisoCodigo1760000000000 implements MigrationInterface {
  name = 'WidenPermisoCodigo1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(resizeCodigo(50));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Falla si ya existen códigos de más de 20 caracteres (esperado).
    await queryRunner.query(resizeCodigo(20));
  }
}

/** nvarchar mide 2 bytes por carácter en COL_LENGTH / sys.columns.max_length. */
function resizeCodigo(length: number): string {
  return `
    IF COL_LENGTH('auth.Permiso', 'codigo') <> ${length * 2}
    BEGIN
      DECLARE @name sysname, @isConstraint bit;

      -- Quitar cualquier UNIQUE (restricción o índice) que dependa de codigo.
      WHILE 1 = 1
      BEGIN
        SET @name = NULL;
        SELECT TOP 1 @name = i.name, @isConstraint = i.is_unique_constraint
        FROM sys.indexes i
        JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE i.object_id = OBJECT_ID('[auth].[Permiso]')
          AND c.name = 'codigo'
          AND i.is_primary_key = 0;

        IF @name IS NULL BREAK;

        IF @isConstraint = 1
          EXEC('ALTER TABLE [auth].[Permiso] DROP CONSTRAINT [' + @name + ']');
        ELSE
          EXEC('DROP INDEX [' + @name + '] ON [auth].[Permiso]');
      END

      ALTER TABLE [auth].[Permiso] ALTER COLUMN [codigo] nvarchar(${length}) NOT NULL;

      ALTER TABLE [auth].[Permiso]
        ADD CONSTRAINT UQ_auth_Permiso_codigo UNIQUE ([codigo]);
    END
  `;
}
