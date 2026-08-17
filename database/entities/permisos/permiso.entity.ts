import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PermisoRol } from './permiso-rol.entity';
import { PermisoUsuario } from './permiso-usuario.entity';

@Entity({ schema: 'auth', name: 'Permiso' })
export class Permiso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  codigo!: string;

  @Column({ type: 'varchar', length: 50 })
  modulo!: string;

  @Column({ type: 'varchar', length: 50 })
  accion!: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  descripcion?: string;

  @Column({ type: 'bit', default: true })
  activo!: boolean;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updated_at?: Date;

  @OneToMany(() => PermisoRol, permisoRol => permisoRol.permiso)
  permisosRol!: PermisoRol[];

  @OneToMany(() => PermisoUsuario, permisoUsuario => permisoUsuario.permiso)
  permisosUsuario!: PermisoUsuario[];
}
