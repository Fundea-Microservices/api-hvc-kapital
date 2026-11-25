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
import { DominioValor } from './dominio-valor.entity';

/**
 * Dominio maestro (PAIS, DEPARTAMENTO, MUNICIPIO, MONEDA, CASA_CENTRAL,
 * TIPO_DOCUMENTO, ...). Vive en el esquema `config`.
 *
 * `esquemaAtributos` es un JSON Schema opcional (texto) que documenta la
 * estructura esperada en `DominioValor.atributos`; se serializa y valida en
 * la capa de servicio, no en la BD.
 */
@Entity({ schema: 'config', name: 'Dominio' })
// El código es único entre los registros vivos: uno eliminado lógicamente
// puede volver a crearse (mismo criterio que auth.TipoUsuario).
@Index('UQ_Dominio_codigo', ['codigo'], {
  unique: true,
  where: '[deleted_at] IS NULL',
})
export class Dominio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Código corto en mayúsculas (ej. MONEDA, PAIS). */
  @Column({ type: 'nvarchar', length: 50, nullable: false })
  codigo!: string;

  @Column({ type: 'nvarchar', length: 100, nullable: false })
  nombre!: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  descripcion?: string | null;

  /** Si es true, los valores del dominio pueden colgar de un `padreId`. */
  @Column({ type: 'bit', default: false })
  permiteJerarquia!: boolean;

  /** JSON Schema opcional para validar/documentar `DominioValor.atributos`. */
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

  @OneToMany(() => DominioValor, (valor) => valor.dominio)
  valores?: DominioValor[];
}
