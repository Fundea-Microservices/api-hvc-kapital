import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Permiso } from './permisos/permiso.entity';

@Entity({ schema: 'auth', name: 'Bitacora_Autorizacion' })
export class BitacoraAutorizacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  endpoint!: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  body_request!: string;

  @Column({ type: 'uuid', nullable: false })
  solicitanteId!: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'solicitanteId' })
  solicitante!: Usuario;

  @Column({ type: 'uuid', nullable: false })
  autorizadorId!: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'autorizadorId' })
  autorizador!: Usuario;

  @Column({ type: 'uuid', nullable: false })
  permisoId!: string;

  @ManyToOne(() => Permiso, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'permisoId' })
  permiso!: Permiso;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  created_at!: Date;
}
