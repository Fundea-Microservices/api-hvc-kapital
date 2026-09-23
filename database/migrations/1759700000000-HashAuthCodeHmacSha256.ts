import { MigrationInterface, QueryRunner } from 'typeorm';
import * as crypto from 'crypto';

/**
 * Amplía auth_code para el digest HMAC-SHA256 (64 hex) y rehashea PINs
 * en claro que hayan quedado del seed anterior (longitud ≤ 10).
 */
export class HashAuthCodeHmacSha2561759700000000 implements MigrationInterface {
  name = 'HashAuthCodeHmacSha2561759700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const secret = process.env.AUTH_CODE_SECRET;
    if (!secret) {
      throw new Error(
        'AUTH_CODE_SECRET es obligatorio para migrar auth_code a HMAC-SHA256.',
      );
    }

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'UQ_Usuario_auth_code'
          AND object_id = OBJECT_ID('[auth].[Usuario]')
      )
        DROP INDEX [UQ_Usuario_auth_code] ON [auth].[Usuario];
    `);

    await queryRunner.query(`
      ALTER TABLE [auth].[Usuario] ALTER COLUMN [auth_code] nvarchar(64) NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE NONCLUSTERED INDEX [UQ_Usuario_auth_code]
        ON [auth].[Usuario]([auth_code] ASC)
        WHERE ([auth_code] IS NOT NULL)
        WITH (
          PAD_INDEX = OFF, FILLFACTOR = 100, SORT_IN_TEMPDB = OFF,
          IGNORE_DUP_KEY = OFF, STATISTICS_NORECOMPUTE = OFF,
          ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON
        ) ON [PRIMARY];
    `);

    const rows: Array<{ id: string; auth_code: string }> = await queryRunner.query(`
      SELECT [id], [auth_code]
      FROM [auth].[Usuario]
      WHERE [auth_code] IS NOT NULL
        AND LEN([auth_code]) <= 10
    `);

    for (const row of rows) {
      const hashed = crypto
        .createHmac('sha256', secret)
        .update(String(row.auth_code).trim())
        .digest('hex');

      await queryRunner.query(
        `UPDATE [auth].[Usuario] SET [auth_code] = '${hashed}' WHERE [id] = '${row.id}'`,
      );
    }
  }

  public async down(): Promise<void> {
    // HMAC no es reversible: no se puede restaurar el PIN en claro.
    throw new Error(
      'No se puede revertir HashAuthCodeHmacSha256: el digest HMAC no permite recuperar el auth_code original.',
    );
  }
}
