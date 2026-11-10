import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Elementos del carrusel de noticias/promociones que se muestran en la web
 * y en la app. Vive en el esquema `config`.
 */
@Entity({ schema: 'config', name: 'Carousel' })
export class Carousel {
  @PrimaryGeneratedColumn('uuid', { name: 'carouselId' })
  carouselId!: string;

  @Column({ type: 'nvarchar', length: 200, nullable: false })
  titulo!: string;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  subtitulo?: string | null;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  codigo?: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  descripcion?: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: false })
  fotoUrl!: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  redireccionUrl?: string | null;

  @Column({ type: 'int', default: 0 })
  orden!: number;

  @Column({ type: 'bit', default: true })
  visibleWeb!: boolean;

  @Column({ type: 'bit', default: true })
  visibleApp!: boolean;

  /** Códigos de usuario separados por coma. NULL = visible para todos. */
  @Column({ type: 'nvarchar', length: 300, nullable: true })
  usuarios?: string | null;

  /**
   * Códigos de auth.TipoUsuario separados por coma. NULL = sin filtro por tipo.
   * Si `usuarios` y `tiposUsuario` son NULL el elemento es para todos; si no,
   * lo ve quien esté en cualquiera de las dos listas.
   */
  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  tiposUsuario?: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  textoBoton?: string | null;

  @Column({ type: 'datetime', nullable: true })
  fechaInicio?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  fechaFin?: Date | null;

  @Column({ type: 'bit', default: false })
  esExterno!: boolean;

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
