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
import { ConfigPolitica } from './config-politica.entity';

/**
 * Módulo funcional de primer nivel para los parámetros generales (`Config`).
 * Es independiente de los catálogos maestros (`CatalogoTipo`): un cambio en
 * los catálogos operativos no debe alterar parámetros del núcleo.
 *
 * Vive en el esquema `auth`, igual que `Config`.
 */
@Entity({ schema: 'auth', name: 'ConfigModulo' })
// Código único entre los registros vivos: uno eliminado lógicamente puede
// volver a crearse con el mismo código (mismo criterio que TipoUsuario).
@Index('UQ_ConfigModulo_codigo', ['codigo'], {
  unique: true,
  where: '[deleted_at] IS NULL',
})
export class ConfigModulo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Clave natural e inmutable para seeds (ej. MOD_CREDITOS). */
  @Column({ type: 'varchar', length: 50, nullable: false })
  codigo!: string;

  /** Nombre visible en la UI (ej. "Créditos"). */
  @Column({ type: 'nvarchar', length: 100, nullable: false })
  nombre!: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  descripcion?: string | null;

  /** Orden de despliegue en selectores y listas. */
  @Column({ type: 'int', default: 0 })
  orden!: number;

  /**
   * Reservado para la futura relación con `Menu.id`. Sin FK en esta fase,
   * por eso se guarda como texto.
   */
  @Column({ type: 'varchar', length: 36, nullable: true })
  menuId?: string | null;

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

  @OneToMany(() => ConfigPolitica, (politica) => politica.modulo)
  politicas?: ConfigPolitica[];
}
