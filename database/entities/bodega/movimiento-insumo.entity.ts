import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Insumo } from './insumo.entity';

@Entity({ name: 'movimiento_insumo' })
export class MovimientoInsumo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  insumo_id!: string;

  @ManyToOne(() => Insumo, insumo => insumo.movimientos)
  @JoinColumn({ name: 'insumo_id' })
  insumo?: Insumo;

  @Column({ type: 'enum', enum: ['ENTRADA', 'SALIDA', 'AJUSTE'] })
  tipo_movimiento!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  cantidad!: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  costo_unitario!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo?: string;

  @Column({ type: 'uuid', nullable: true })
  usuario_id?: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_movimiento!: Date;
}
