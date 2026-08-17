import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  DeleteDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Acceso } from './acceso.entity';
import { PermisoRol } from './permisos/permiso-rol.entity';

@Entity({ schema: 'auth', name: 'rol' })
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  nombre!: string;

  @Column({ type: 'boolean', default: false })
  invitado!: boolean;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({ type: 'boolean', default: false })
  esAdmin!: boolean;

  //Relación con la tabla Usuarios
  @OneToMany(() => Usuario, usuario => usuario.rol)
  usuarios!: Usuario[];

  @OneToMany(() => Acceso, acceso => acceso.rol)
  accesos!: Acceso[];

  @OneToMany(() => PermisoRol, permisoRol => permisoRol.rol)
  permisosRol!: PermisoRol[];

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updated_at?: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at?: Date;
}