import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity({ name: 'puesto', schema: 'tesoreria' })
export class Puesto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'nvarchar', length: 150, nullable: false })
  nombre!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  //Relación con la tabla Usuarios
  @OneToMany(() => Usuario, usuario => usuario.rol)
  usuarios!: Usuario[];

}