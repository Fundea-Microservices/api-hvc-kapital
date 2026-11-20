import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Config } from './config.entity';
import { ConfigModulo } from './config-modulo.entity';

/**
 * Política de segundo nivel: agrupa parámetros (`Config`) dentro de un
 * módulo. Cada política pertenece a un único módulo, de modo que
 * `Config.politicaId` resuelve el módulo sin duplicar `moduloId` en `Config`.
 */
@Entity({ schema: 'auth', name: 'ConfigPolitica' })
@Index('UQ_ConfigPolitica_codigo', ['codigo'], {
  unique: true,
  where: '[deleted_at] IS NULL',
})
@Index('IX_ConfigPolitica_moduloId', ['moduloId'])
export class ConfigPolitica {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  moduloId!: string;

  @ManyToOne(() => ConfigModulo, (modulo) => modulo.politicas, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'moduloId',
    foreignKeyConstraintName: 'FK_ConfigPolitica_ConfigModulo',
  })
  modulo?: ConfigModulo;

  /** Clave natural e inmutable para seeds (ej. POL_TASAS_COMISIONES). */
  @Column({ type: 'varchar', length: 50, nullable: false })
  codigo!: string;

  /** Nombre visible en la UI (ej. "Tasas y Comisiones"). */
  @Column({ type: 'nvarchar', length: 100, nullable: false })
  nombre!: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  descripcion?: string | null;

  /** Orden de despliegue dentro de su módulo. */
  @Column({ type: 'int', default: 0 })
  orden!: number;

  @Column({ type: 'bit', default: true })
  activo!: boolean;

  @CreateDateColumn({
    type: 'datetime2',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime2', nullable: true })
  updated_at?: Date;

  @DeleteDateColumn({ type: 'datetime2', nullable: true })
  deleted_at?: Date;

  @OneToMany(() => Config, (config) => config.politica)
  configs?: Config[];
}
