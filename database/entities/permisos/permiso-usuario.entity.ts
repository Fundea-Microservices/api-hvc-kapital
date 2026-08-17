import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../usuario.entity';
import { Permiso } from './permiso.entity';

@Entity({ schema: 'auth', name: 'Permiso_Usuario' })
export class PermisoUsuario {
  @PrimaryColumn({ type: 'uuid' })
  usuarioId!: string;

  @PrimaryColumn({ type: 'uuid' })
  permisoId!: string;

  @Column({ type: 'boolean', default: true })
  permitido!: boolean;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario!: Usuario;

  @ManyToOne(() => Permiso, permiso => permiso.permisosUsuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permisoId' })
  permiso!: Permiso;
}
