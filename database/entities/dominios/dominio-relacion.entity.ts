import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DominioValor } from './dominio-valor.entity';

/**
 * Cruce N:M entre valores de dominios independientes (ej. qué MONEDA está
 * habilitada en una AGENCIA). `tipoRelacion` da semántica al vínculo.
 *
 * Ambas FKs apuntan a DominioValor y usan `NO ACTION`: SQL Server no permite
 * dos rutas CASCADE desde la misma tabla padre hacia la misma tabla hija.
 */
@Entity({ schema: 'config', name: 'DominioRelacion' })
@Index(
  'UQ_DominioRelacion_Unica',
  ['valorOrigenId', 'valorDestinoId', 'tipoRelacion'],
  { unique: true, where: '[deleted_at] IS NULL' },
)
@Index('IX_DominioRelacion_Origen_Tipo', [
  'valorOrigenId',
  'tipoRelacion',
  'activo',
])
export class DominioRelacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  valorOrigenId!: string;

  @ManyToOne(() => DominioValor, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'valorOrigenId',
    foreignKeyConstraintName: 'FK_DominioRelacion_ValorOrigen',
  })
  valorOrigen?: DominioValor;

  @Column({ type: 'uuid', nullable: false })
  valorDestinoId!: string;

  @ManyToOne(() => DominioValor, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'valorDestinoId',
    foreignKeyConstraintName: 'FK_DominioRelacion_ValorDestino',
  })
  valorDestino?: DominioValor;

  /** Identificador semántico del vínculo (ej. MONEDA_HABILITADA). */
  @Column({ type: 'nvarchar', length: 50, nullable: false })
  tipoRelacion!: string;

  /** Reglas propias de la combinación (JSON guardado como texto). */
  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  atributos?: string | null;

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
}
