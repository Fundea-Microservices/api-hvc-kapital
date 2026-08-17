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

  @Column({ type: 'boolean', default: true })
  principal!: boolean;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @OneToMany(() => Acceso, acceso => acceso.menu)
  accesos!: Acceso[];

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  created_at!: Date;
  
  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updated_at?: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at?: Date;
}