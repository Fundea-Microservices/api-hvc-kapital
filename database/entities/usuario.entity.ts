import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { Rol } from './rol.entity';
import { Puesto } from './puesto.entity';
import { Sucursal } from './sucursal.entity';
import { PermisoUsuario } from './permisos/permiso-usuario.entity';

@Entity({ schema: 'auth', name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 250 })
  nombreCompleto!: string;

  @Column({ type: 'varchar', length: 50 })
  nombre1!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombre2?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombre3?: string;

  @Column({ type: 'varchar', length: 50 })
  apellido1!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellido2?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellido3?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  documento?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  tipoDocumento?: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  userName!: string;

  @Column({ type: 'varchar', length: 200 })
  clave!: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  correo!: string;

  @Column({ type: 'varchar', length: 350, nullable: true })
  fotoUrl?: string;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP'})
  lastPasswordUpdate!: Date;

  @Column({ type: 'text', nullable: true })
  huella?: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({ type: 'uuid', nullable: false })
  rolId!: string;

  @ManyToOne(() => Rol, rol => rol.usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rolId' }) // Relación usando la columna orderId
  rol?: Rol;

  @Column({ type: 'uuid', nullable: true })
  puestoId?: string;

  @ManyToOne(() => Puesto, puesto => puesto.usuarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'puestoId' }) // Relación usando la columna orderId
  puesto?: Puesto;

  @Column({ type: 'uuid', nullable: true })
  sucursalId?: string;

  @ManyToOne(() => Sucursal, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'sucursalId' })
  sucursal?: Sucursal;

  @OneToMany(() => PermisoUsuario, permisoUsuario => permisoUsuario.usuario)
  permisosUsuario!: PermisoUsuario[];

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP'})
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updated_at?: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at?: Date;
}