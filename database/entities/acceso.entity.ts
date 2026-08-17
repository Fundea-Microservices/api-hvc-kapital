import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    OneToMany,
    JoinColumn,
    ManyToOne,
    DeleteDateColumn,
    UpdateDateColumn
} from 'typeorm';
import { Rol } from './rol.entity';
import { Menu } from './menu.entity';

@Entity({ schema: 'auth', name: 'acceso' })
export class Acceso {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'int' })
    ordenMenu!: number;

    @Column({ type: 'bit', default: true })
    showApp!: boolean;

    @Column({ type: 'bit', default: true })
    showWeb!: boolean;

    @Column({ type: 'bit', default: true })
    activo!: boolean;

    @Column({ type: 'uuid', nullable: true })
    mainMenuId?: string;

    @Column({ type: 'uuid', nullable: false })
    menuId!: string;
    
    @ManyToOne(() => Menu, menu => menu.accesos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'menuId' }) // Relación usando la columna orderId
    menu!: Menu;

    @Column({ type: 'uuid', nullable: false })
    rolId!: string;

    @ManyToOne(() => Rol, rol => rol.accesos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rolId' }) // Relación usando la columna orderId
    rol!: Rol;

    @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updated_at?: Date;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deleted_at?: Date;

}