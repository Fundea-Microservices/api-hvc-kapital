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
import { DominioValor } from '../dominios/dominio-valor.entity';

/**
 * Configuración General Institucional — patrón Singleton.
 *
 * Solo puede existir un registro. No se expone creación ni borrado por API:
 * el registro inicial lo crea el seed y las modificaciones pasan por el
 * servicio transaccional que audita en `BitacoraConfigGeneral`.
 *
 * Las tres llaves hacia `DominioValor` usan `NO ACTION` para evitar rutas de
 * cascada múltiple en SQL Server (igual que DominioValor.padreId).
 */
@Entity({ schema: 'config', name: 'ConfigGeneral' })
@Index('UQ_ConfigGeneral_codigoInterno', ['codigoInterno'], {
  unique: true,
  where: '[deleted_at] IS NULL',
})
@Index('UQ_ConfigGeneral_nit', ['nit'], {
  unique: true,
  where: '[deleted_at] IS NULL',
})
export class ConfigGeneral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 30 })
  codigoInterno!: string;

  @Column({ type: 'nvarchar', length: 150 })
  nombreComercial!: string;

  @Column({ type: 'uuid' })
  codigoCasaCentral!: string;

  @ManyToOne(() => DominioValor, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'codigoCasaCentral' })
  casaCentralValor?: DominioValor;

  @Column({ type: 'uuid' })
  pais!: string;

  @ManyToOne(() => DominioValor, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'pais' })
  paisValor?: DominioValor;

  @Column({ type: 'uuid' })
  monedaPrincipal!: string;

  @ManyToOne(() => DominioValor, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'monedaPrincipal' })
  monedaValor?: DominioValor;

  // Tipo `date` puro: evita desfases de zona horaria en fechas contables.
  @Column({ type: 'date' })
  fechaCierre!: string;

  @Column({ type: 'date' })
  fechaApertura!: string;

  @Column({ type: 'date' })
  cierreMensual!: string;

  @Column({ type: 'varchar', length: 20 })
  nit!: string;

  @Column({ type: 'varchar', length: 30 })
  codigoSIB!: string;

  @Column({ type: 'varchar', length: 30 })
  registroMercadoValores!: string;

  @Column({ type: 'nvarchar', length: 150 })
  representanteLegal!: string;

  @Column({ type: 'varchar', length: 20 })
  dpiRepresentante!: string;

  @Column({ type: 'nvarchar', length: 300 })
  direccionFiscal!: string;

  @Column({ type: 'varchar', length: 5 })
  horaInicioOp!: string;

  @Column({ type: 'varchar', length: 5 })
  horaCierreOp!: string;

  @Column({ type: 'bit', default: true })
  activo!: boolean;

  @CreateDateColumn({ type: 'datetime2', default: () => 'getdate()' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime2', nullable: true })
  updated_at?: Date;

  @DeleteDateColumn({ type: 'datetime2', nullable: true })
  deleted_at?: Date;
}
