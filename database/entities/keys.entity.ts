import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';

@Entity({ schema: 'auth', name: 'keys' })
export class Keys {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50 })
    nombre!: string;

    @Column({ type: 'varchar', length: 250 })
    descripcion!: string;

    @Column({ type: 'varbinary', length: 32 })
    valor!: Buffer;
    
    @Column({ type: 'boolean', default: true })
    activo!: boolean;

    @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updated_at?: Date;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deleted_at?: Date;
}