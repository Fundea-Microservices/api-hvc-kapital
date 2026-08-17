import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ schema: 'auth', name: 'sucursal' })
export class Sucursal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100 })
  municipio!: string;

  @Column({ type: 'varchar', length: 100 })
  departamento!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion?: string;

  @Column({ type: 'bit', default: false })
  central!: boolean;

  // TypeORM maneja automáticamente la inserción de la fecha actual
  // Usamos camelCase para TypeScript, pero lo mapeamos a la columna 'created_at' en BD
  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at!: Date;
}