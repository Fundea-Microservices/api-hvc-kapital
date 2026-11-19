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
import { CatalogoTipo } from './catalogo-tipo.entity';

/**
 * Ítem individual de un catálogo universal. Soporta jerarquías recursivas
 * (padreId) y metadatos dinámicos en `atributos` (JSON guardado como texto).
 *
 * Las relaciones usan `NO ACTION` porque SQL Server rechaza rutas de cascada
 * múltiples/recursivas sobre la misma tabla.
 */
@Entity({ schema: 'config', name: 'CatalogoItem' })
@Index('UQ_CatalogoItem_Tipo_Codigo', ['catalogoTipoId', 'codigo'], {
  unique: true,
  where: '[deleted_at] IS NULL',
})
@Index('IX_CatalogoItem_Padre', ['padreId'])
@Index('IX_CatalogoItem_Tipo_Activo', ['catalogoTipoId', 'activo', 'orden'])
export class CatalogoItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  catalogoTipoId!: string;

  @ManyToOne(() => CatalogoTipo, (tipo) => tipo.items, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'catalogoTipoId',
    foreignKeyConstraintName: 'FK_CatalogoItem_CatalogoTipo',
  })
  catalogoTipo?: CatalogoTipo;

  @Column({ type: 'uuid', nullable: true })
  padreId?: string | null;

  @ManyToOne(() => CatalogoItem, (item) => item.hijos, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({
    name: 'padreId',
    foreignKeyConstraintName: 'FK_CatalogoItem_Padre',
  })
  padre?: CatalogoItem | null;

  @OneToMany(() => CatalogoItem, (item) => item.padre)
  hijos?: CatalogoItem[];

  /** Único dentro de su mismo `catalogoTipoId`. */
  @Column({ type: 'nvarchar', length: 50, nullable: false })
  codigo!: string;

  @Column({ type: 'nvarchar', length: 150, nullable: false })
  nombre!: string;

  /** Valor estandarizado u operativo (ej. 502, GTQ, AG-01). */
  @Column({ type: 'nvarchar', length: 255, nullable: false })
  valor!: string;

  @Column({ type: 'int', default: 0 })
  orden!: number;

  /** Objeto JSON con propiedades extendidas del dominio (texto en BD). */
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
