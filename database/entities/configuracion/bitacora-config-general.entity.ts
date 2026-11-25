import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../usuario.entity';
import { BitacoraAutorizacion } from '../bitacora-autorizacion.entity';

/**
 * Bitácora inmutable (append-only) de `ConfigGeneral`.
 *
 * No tiene `updated_at` ni `deleted_at` y no se exponen endpoints de escritura.
 * `registroId` queda deliberadamente sin FK física para que el historial
 * sobreviva a cualquier mantenimiento del registro de configuración.
 */
@Entity({ schema: 'config', name: 'BitacoraConfigGeneral' })
@Index('IX_BitacoraConfigGeneral_created_at', ['created_at'])
@Index('IX_BitacoraConfigGeneral_usuarioId', ['usuarioId'])
export class BitacoraConfigGeneral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  registroId!: string;

  @Column({ type: 'varchar', length: 20 })
  accion!: 'INSERT' | 'UPDATE' | 'SOFT_DELETE';

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  versionAnterior?: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  versionNueva?: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  camposModificados?: string | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  justificacion?: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  estacionIp?: string | null;

  @Column({ type: 'uuid', nullable: true })
  usuarioId?: string | null;

  @ManyToOne(() => Usuario, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'usuarioId' })
  usuario?: Usuario | null;

  @Column({ type: 'uuid', nullable: true })
  bitacoraAutorizacionId?: string | null;

  @ManyToOne(() => BitacoraAutorizacion, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'bitacoraAutorizacionId' })
  bitacoraAutorizacion?: BitacoraAutorizacion | null;

  @Column({ type: 'varchar', length: 30, default: 'API' })
  origen!: 'API' | 'PROCESO_CIERRE' | 'MIGRACION_SEED';

  @CreateDateColumn({ type: 'datetime2', default: () => 'getdate()' })
  created_at!: Date;
}
