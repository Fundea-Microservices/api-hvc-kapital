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
import { Dominio } from './dominio.entity';

/**
 * Valor estandarizado de un dominio maestro. Soporta jerarquías recursivas
 * (padreId) y metadatos dinámicos en `atributos` (JSON guardado como texto).
 *
 * Las relaciones usan `NO ACTION` porque SQL Server rechaza rutas de cascada
 * múltiples/recursivas sobre la misma tabla.
 */
@Entity({ schema: 'config', name: 'DominioValor' })
@Index('UQ_DominioValor_Dominio_Codigo', ['dominioId', 'codigo'], {
  unique: true,
  where: '[deleted_at] IS NULL',
})
@Index('IX_DominioValor_Padre', ['padreId'])
@Index('IX_DominioValor_Dominio_Activo', [
  'dominioId',
  'activo',
  'ordenMenu',
])
export class DominioValor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  dominioId!: string;

  @ManyToOne(() => Dominio, (dominio) => dominio.valores, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'dominioId',
    foreignKeyConstraintName: 'FK_DominioValor_Dominio',
  })
  dominio?: Dominio;

  @Column({ type: 'uuid', nullable: true })
  padreId?: string | null;

  @ManyToOne(() => DominioValor, (valor) => valor.hijos, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({
    name: 'padreId',
    foreignKeyConstraintName: 'FK_DominioValor_Padre',
  })
  padre?: DominioValor | null;

  @OneToMany(() => DominioValor, (valor) => valor.padre)
  hijos?: DominioValor[];

  /** Único dentro de su mismo `dominioId`. */
  @Column({ type: 'nvarchar', length: 50, nullable: false })
  codigo!: string;

  @Column({ type: 'nvarchar', length: 150, nullable: false })
  nombre!: string;

  /** Valor estandarizado u operativo (ej. 502, GTQ, AGE-001). */
  @Column({ type: 'nvarchar', length: 255, nullable: false })
  valor!: string;

  /** Orden de despliegue en listas y selectores. */
  @Column({ type: 'int', default: 0 })
  ordenMenu!: number;

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
