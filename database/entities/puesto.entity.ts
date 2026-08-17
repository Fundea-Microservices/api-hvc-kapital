import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity({ schema: 'auth', name: 'puesto' })
export class Puesto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'nvarchar', length: 150, nullable: false })
  nombre!: string;

  @Column({ type: 'bit', default: true })
  activo!: boolean;

  //Relación con la tabla Usuarios
  @OneToMany(() => Usuario, usuario => usuario.rol)
  usuarios!: Usuario[];

}