import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConfigPolitica } from './config-politica.entity';

export enum TipoConfiguracion {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
}

@Entity({ schema: 'auth', name: 'config' })
@Index('IX_Config_politicaId', ['politicaId'])
export class Config {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Política a la que pertenece el parámetro. El módulo se resuelve
   * atravesando `politica.moduloId`; no se duplica en esta tabla.
   */
  @Column({ type: 'uuid', nullable: false })
  politicaId!: string;

  @ManyToOne(() => ConfigPolitica, (politica) => politica.configs, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'politicaId',
    foreignKeyConstraintName: 'FK_Config_ConfigPolitica',
  })
  politica?: ConfigPolitica;

  @Column({ type: 'varchar', length: 50, nullable: false })
  llave!: string;

  @Column({ type: 'varchar', length: 1000, nullable: false })
  valor!: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  tipo!: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  descripcion?: string;

  @Column({ type: 'bit', default: true })
  activo!: boolean;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  updated_at?: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at?: Date;

}
