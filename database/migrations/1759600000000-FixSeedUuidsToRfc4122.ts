import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remapea IDs del seed que no cumplían RFC 4122 (rechazados por @IsUUID('all')).
 *
 * Si se recrea la BD desde cero, este UPDATE no afecta filas (el seed insertará
 * ya los IDs nuevos). Si la BD de desarrollo ya tiene el seed anterior, corre
 * esta migración ANTES de volver a sembrar para no duplicar registros.
 */
const ID_MAP: Array<{ oldId: string; newId: string }> = [
  { oldId: 'D3F4E5A6-7B8C-4D9E-0F1A-2B3C4D5E6F7A', newId: 'C8B570F3-91BC-4C39-BF6F-7A5EE4AF02C8' }, // userAdmin
  { oldId: 'C2B3D4E5-6F7A-8B9C-0D1E-2F3A4B5C6D7E', newId: '42C8C072-7D7A-4AD7-9FA1-5B905848F1B6' }, // ROL_EDITAR
  { oldId: 'D3C4E5F6-7A8B-9C0D-1E2F-3A4B5C6D7E8F', newId: 'D5DA0A5E-F462-42A6-B3E0-5BBE600275BF' }, // ROL_ELIMINAR
  { oldId: 'E4D5F6A7-8B9C-0D1E-2F3A-4B5C6D7E8F90', newId: 'E7948898-BFCE-451B-9A10-54666A7046EE' }, // MENU_CREAR
  { oldId: 'F5E6A7B8-9C0D-1E2F-3A4B-5C6D7E8F90A1', newId: '3856F3EE-238A-4008-89D6-48D1833B6C38' }, // MENU_EDITAR
  { oldId: 'A6F7B8C9-0D1E-2F3A-4B5C-6D7E8F90A1B2', newId: '55854A2E-E830-46EE-92ED-984070D7D6F5' }, // MENU_ELIMINAR
  { oldId: 'B7A8C9D0-1E2F-3A4B-5C6D-7E8F90A1B2C3', newId: '66B479EA-FCCA-4304-AF10-092B81D03688' }, // ACCESO_CREAR
  { oldId: 'C8B9D0E1-2F3A-4B5C-6D7E-8F90A1B2C3D4', newId: 'C7B90EFB-0B0A-40A9-A0DB-6D31DF6DCAE5' }, // ACCESO_EDITAR
  { oldId: 'D9C0E1F2-3A4B-5C6D-7E8F-90A1B2C3D4E5', newId: 'A945BF86-1FB5-4804-968C-0996FB7FB1EC' }, // ACCESO_ELIMINAR
  { oldId: 'B3A4C5D6-7E8F-90A1-B2C3-D4E5F6A7B8C9', newId: '55B50D7B-EA36-4AC0-BE86-8ECB5750D543' }, // SUCURSAL_CREAR
  { oldId: 'C4B5D6E7-8F90-A1B2-C3D4-E5F6A7B8C9D0', newId: '5CEF5A2C-1405-4ADA-A94E-53A5A9F662D0' }, // SUCURSAL_EDITAR
  { oldId: 'D5C6E7F8-90A1-B2C3-D4E5-F6A7B8C9D0E1', newId: '8E5F70EA-DABA-45D4-9FD3-92F316021A12' }, // SUCURSAL_ELIMINAR
  { oldId: 'E6D7F8A9-0A1B-2C3D-4E5F-6A7B8C9D0E1F', newId: '978FA3C6-31DC-483A-8436-42FBC6D3D10A' }, // CONFIG_CREAR
  { oldId: 'F7E8A9B0-1B2C-3D4E-5F6A-7B8C9D0E1F2A', newId: 'C6E2AFCC-8928-4FC7-A9F4-D0A8E132EE75' }, // CONFIG_EDITAR
  { oldId: 'A8F9B0C1-2C3D-4E5F-6A7B-8C9D0E1F2A3B', newId: 'E93A5C09-EF5B-4D78-AC67-002C36A190C8' }, // CONFIG_ELIMINAR
  { oldId: 'B9A0C1D2-3D4E-5F6A-7B8C-9D0E1F2A3B4C', newId: 'C3962717-4A95-4E3C-9D49-831375E9541B' }, // APIKEY_CREAR
  { oldId: 'E2D3F4A5-6A7B-8C9D-0E1F-2A3B4C5D6E7F', newId: 'C02DCCBF-8B8A-4C22-984B-825A1A97F1FA' }, // PERM_CREAR
  { oldId: 'F3E4A5B6-7B8C-9D0E-1F2A-3B4C5D6E7F80', newId: '5C467F5F-B50C-449E-8A98-B5440F4BDC70' }, // PERM_EDITAR
  { oldId: 'A4F5B6C7-8C9D-0E1F-2A3B-4C5D6E7F8091', newId: '0EBE0675-5722-4695-9A33-882DC3F6445E' }, // PERM_ELIMINAR
  { oldId: 'B5A6C7D8-9D0E-1F2A-3B4C-5D6E7F8091A2', newId: '23AC2EA7-B3B7-44FB-8A5B-9A59E8982970' }, // PERM_ROL_CREAR
  { oldId: 'C6B7D8E9-0E1F-2A3B-4C5D-6E7F8091A2B3', newId: '6FDC3CCE-6D58-4940-A95C-B04A30ADABA9' }, // PERM_ROL_ELIMINAR
  { oldId: 'D7C8E9F0-1F2A-3B4C-5D6E-7F8091A2B3C4', newId: '88C68740-FB5E-4E7E-A66F-0F323C6F6C27' }, // PERM_USR_EDITAR
  { oldId: 'E8D9F0A1-2A3B-4C5D-6E7F-8091A2B3C4D5', newId: '49D7EA10-2CC3-4EA9-BC38-62B10616BB25' }, // PERM_USR_ELIMINAR
  { oldId: 'F9E0A1B2-3B4C-5D6E-7F80-91A2B3C4D5E6', newId: 'B7D923ED-F701-4F60-A180-25A5F7641012' }, // BIT_ELIMINAR
  { oldId: 'B2C3D4E5-F6A7-8B9C-0D1E-2F3A4B5C6D7E', newId: '20DCF45E-E39E-4647-BB07-F25C4F30A7C1' }, // configRolDefault
  { oldId: '8A9B1C2D-3E4F-5A6B-7C8D-9E0F1A2B3C4D', newId: '0E094E59-6952-4FC6-8A1B-CEFD3533948A' }, // acceso bitácora
];

const FK_TABLES = [
  '[auth].[Permiso_Rol]',
  '[auth].[Permiso_Usuario]',
  '[auth].[Bitacora_Autorizacion]',
  '[auth].[Usuario]',
  '[auth].[Acceso]',
  '[auth].[Permiso]',
  '[auth].[Config]',
];

export class FixSeedUuidsToRfc41221759600000000 implements MigrationInterface {
  name = 'FixSeedUuidsToRfc41221759600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.toggleConstraints(queryRunner, false);
    for (const { oldId, newId } of ID_MAP) {
      await this.remapId(queryRunner, oldId, newId);
    }
    await this.toggleConstraints(queryRunner, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.toggleConstraints(queryRunner, false);
    for (const { oldId, newId } of [...ID_MAP].reverse()) {
      await this.remapId(queryRunner, newId, oldId);
    }
    await this.toggleConstraints(queryRunner, true);
  }

  private async toggleConstraints(queryRunner: QueryRunner, enable: boolean): Promise<void> {
    for (const table of FK_TABLES) {
      await queryRunner.query(
        enable
          ? `ALTER TABLE ${table} WITH CHECK CHECK CONSTRAINT ALL`
          : `ALTER TABLE ${table} NOCHECK CONSTRAINT ALL`,
      );
    }
  }

  private async remapId(queryRunner: QueryRunner, fromId: string, toId: string): Promise<void> {
    const updates = [
      `UPDATE [auth].[Permiso_Rol] SET [permisoId] = '${toId}' WHERE [permisoId] = '${fromId}'`,
      `UPDATE [auth].[Permiso_Usuario] SET [permisoId] = '${toId}' WHERE [permisoId] = '${fromId}'`,
      `UPDATE [auth].[Permiso_Usuario] SET [usuarioId] = '${toId}' WHERE [usuarioId] = '${fromId}'`,
      `UPDATE [auth].[Bitacora_Autorizacion] SET [permisoId] = '${toId}' WHERE [permisoId] = '${fromId}'`,
      `UPDATE [auth].[Bitacora_Autorizacion] SET [solicitanteId] = '${toId}' WHERE [solicitanteId] = '${fromId}'`,
      `UPDATE [auth].[Bitacora_Autorizacion] SET [autorizadorId] = '${toId}' WHERE [autorizadorId] = '${fromId}'`,
      `UPDATE [auth].[Permiso] SET [id] = '${toId}' WHERE [id] = '${fromId}'`,
      `UPDATE [auth].[Usuario] SET [id] = '${toId}' WHERE [id] = '${fromId}'`,
      `UPDATE [auth].[Config] SET [id] = '${toId}' WHERE [id] = '${fromId}'`,
      `UPDATE [auth].[Acceso] SET [id] = '${toId}' WHERE [id] = '${fromId}'`,
    ];

    for (const sql of updates) {
      await queryRunner.query(sql);
    }
  }
}
