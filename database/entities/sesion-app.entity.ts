import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Sesion de la app movil en un equipo concreto. Permite el corte remoto desde
// el BackOffice (Activa = 0) aunque el access token siga vigente.
@Entity({ schema: 'app', name: 'Sesiones' })
export class SesionApp {
  @PrimaryGeneratedColumn({ name: 'IdSesion' })
  idSesion!: number;

  @Column({ name: 'IdUsuario', type: 'uuid' })
  idUsuario!: string;

  @Column({ name: 'IdDispositivo', type: 'int' })
  idDispositivo!: number;

  // Hash del refresh token, nunca el valor en claro. Null hasta la Fase 2.
  @Column({
    name: 'RefreshToken',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  refreshToken?: string | null;

  @Column({ name: 'FechaInicio', type: 'datetime', default: () => 'GETDATE()' })
  fechaInicio!: Date;

  @Column({ name: 'FechaExpiracion', type: 'datetime', nullable: true })
  fechaExpiracion?: Date | null;

  @Column({ name: 'Activa', type: 'bit', default: true })
  activa!: boolean;
}
