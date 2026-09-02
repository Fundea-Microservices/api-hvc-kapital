import {
    Entity,
    Column,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Rol } from '../rol.entity';
import { Permiso } from './permiso.entity';

@Entity({ schema: 'auth', name: 'Permiso_Rol' })
export class PermisoRol {
  @PrimaryColumn({ type: 'uuid' })
  rolId!: string;

  @PrimaryColumn({ type: 'uuid' })
  permisoId!: string;

  @Column({ type: 'bit', default: false })
  autoriza!: boolean;

  @ManyToOne(() => Rol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rolId' })
  rol!: Rol;

  @ManyToOne(() => Permiso, permiso => permiso.permisosRol, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permisoId' })
  permiso!: Permiso;
}
