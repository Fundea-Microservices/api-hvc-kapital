import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  DeleteDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Acceso } from './acceso.entity';

@Entity({ schema: 'auth', name: 'menu' })
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 30 })
  label!: string;

  @Column({ type: 'varchar', length: 255 })
  descripcion!: string;

  @Column({ type: 'varchar', length: 100 })
  pathApp!: string;
  
  @Column({ type: 'varchar', length: 100 })
  pathWeb!: string;

  @Column({ type: 'varchar', length: 80 })
  icono!: string;

  @Column({ type: 'varchar', length: 30 })
  color!: string;

  @Column({ type: 'bit', default: true })
  principal!: boolean;

  @Column({ type: 'bit', default: true })
  activo!: boolean;

  /**
   * Códigos de auth.TipoUsuario separados por coma que pueden ver la opción.
   * NULL = sin filtro por tipo, igual que config.Carousel.tiposUsuario.
   */
  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  tiposUsuario?: string | null;

  @OneToMany(() => Acceso, acceso => acceso.menu)
  accesos!: Acceso[];

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  created_at!: Date;
  
  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updated_at?: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at?: Date;
}