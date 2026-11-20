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
import { CatalogoItem } from './catalogo-item.entity';

/**
 * Cruce N:M entre ítems de catálogos independientes (ej. qué MONEDA está
 * habilitada en una AGENCIA). `tipoRelacion` da semántica al vínculo.
 *
 * Ambas FKs apuntan a CatalogoItem y usan `NO ACTION`: SQL Server no permite
 * dos rutas CASCADE desde la misma tabla padre hacia la misma tabla hija.
 */
@Entity({ schema: 'config', name: 'CatalogoRelacion' })
@Index(
  'UQ_CatalogoRelacion_Unica',
  ['itemOrigenId', 'itemDestinoId', 'tipoRelacion'],
  { unique: true, where: '[deleted_at] IS NULL' },
)
@Index('IX_CatalogoRelacion_Origen_Tipo', [
  'itemOrigenId',
  'tipoRelacion',
  'activo',
])
export class CatalogoRelacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  itemOrigenId!: string;

  @ManyToOne(() => CatalogoItem, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'itemOrigenId',
    foreignKeyConstraintName: 'FK_CatalogoRelacion_ItemOrigen',
  })
  itemOrigen?: CatalogoItem;

  @Column({ type: 'uuid', nullable: false })
  itemDestinoId!: string;

  @ManyToOne(() => CatalogoItem, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'itemDestinoId',
    foreignKeyConstraintName: 'FK_CatalogoRelacion_ItemDestino',
  })
  itemDestino?: CatalogoItem;

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
