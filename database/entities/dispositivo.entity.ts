import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

// Equipo movil enrolado. El HardwareID es inmutable y el DeviceToken es la
// credencial con la que la app se identifica en las rutas de /devices.
@Entity({ schema: 'app', name: 'Dispositivos' })
export class Dispositivo {
  @PrimaryGeneratedColumn({ name: 'IdDispositivo' })
  idDispositivo!: number;

  @Column({ name: 'HardwareID', type: 'varchar', length: 100 })
  hardwareId!: string;

  @Column({ name: 'DeviceToken', type: 'varchar', length: 255 })
  deviceToken!: string;

  // Dueno del enrolamiento: el usuario cuyo codigo se uso para enrolar.
  @Column({ name: 'IdUsuario', type: 'uuid' })
  idUsuario!: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'IdUsuario' })
  usuario?: Usuario;

  // 0 = bloqueado por el BackOffice; la app borra su base local al detectarlo.
  @Column({ name: 'Estado', type: 'bit', default: true })
  estado!: boolean;

  @Column({ name: 'Modelo', type: 'nvarchar', length: 100, nullable: true })
  modelo?: string | null;

  @Column({ name: 'VersionSO', type: 'nvarchar', length: 50, nullable: true })
  versionSO?: string | null;

  @Column({
    name: 'FechaIngreso',
    type: 'datetime',
    default: () => 'GETDATE()',
  })
  fechaIngreso!: Date;

  @Column({
    name: 'FechaModificacion',
    type: 'datetime',
    default: () => 'GETDATE()',
  })
  fechaModificacion!: Date;
}
