import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CatalogoItem } from './catalogo-item.entity';

/**
 * Maestro de catálogos universales (PAIS, DEPARTAMENTO, MONEDA, ...).
 * Vive en el esquema `catalogos`.
 *
 * `esquemaAtributos` es un JSON Schema opcional (texto) que documenta la
 * estructura esperada en `CatalogoItem.atributos`; se serializa y valida en
 * la capa de servicio, no en la BD.
 */
@Entity({ schema: 'config', name: 'CatalogoTipo' })
// El código es único entre los registros vivos: uno eliminado lógicamente
// puede volver a crearse (mismo criterio que auth.TipoUsuario).
@Index('UQ_CatalogoTipo_codigo', ['codigo'], {
  unique: true,
  where: '[deleted_at] IS NULL',
})
export class CatalogoTipo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Código corto en mayúsculas (ej. MONEDA, PAIS). */
  @Column({ type: 'nvarchar', length: 50, nullable: false })
  codigo!: string;

  @Column({ type: 'nvarchar', length: 100, nullable: false })
  nombre!: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  descripcion?: string | null;

  /** Si es true, los ítems del catálogo pueden colgar de un `padreId`. */
  @Column({ type: 'bit', default: false })
  permiteJerarquia!: boolean;

  /** JSON Schema opcional para validar/documentar `CatalogoItem.atributos`. */
  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  esquemaAtributos?: string | null;

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

  @OneToMany(() => CatalogoItem, (item) => item.catalogoTipo)
  items?: CatalogoItem[];
}
