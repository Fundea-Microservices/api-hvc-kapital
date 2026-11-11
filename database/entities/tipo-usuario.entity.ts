import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Catálogo de tipos de usuario (INVERSOR, EMPLEADO, ...).
 * Sus códigos se usan, por ejemplo, en config.Carousel.tiposUsuario para
 * limitar a qué tipos de usuario se muestra un elemento.
 */
@Entity({ schema: 'auth', name: 'TipoUsuario' })
export class TipoUsuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Único entre los registros no eliminados (índice filtrado). */
  @Column({ type: 'varchar', length: 50, nullable: false })
  codigo!: string;

  /** Nombre para mostrar (ej. "Inversor"). */
  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion?: string | null;

  @Column({ type: 'bit', default: true })
  activo!: boolean;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updated_at?: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at?: Date;
}
