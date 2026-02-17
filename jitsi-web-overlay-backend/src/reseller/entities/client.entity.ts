import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToOne,
    OneToMany,
    Index,
} from 'typeorm';
import { Offer } from './offer.entity';
import { ClientCustomization } from './client-customization.entity';
import { ClientModule } from './client-module.entity';
import { ClientAuthConfig } from './client-auth-config.entity';
import { ClientDomain } from './client-domain.entity';
import { OfferType } from '../enums/offer-type.enum';
import { ModuleKey } from '../enums/module-key.enum';

/**
 * Entité Client - Représente un client d'un revendeur
 * Unit de facturation, isolation, personnalisation
 */
@Entity('clients')
@Index(['resellerId', 'isActive'])
@Index(['createdAt'])
@Index(['resellerId', 'name'], { unique: true })
export class Client {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 36, unique: true })
    uid: string; // UUID v4

    @Column()
    name: string;

    @Column({ type: 'enum', enum: OfferType })
    offerType: OfferType;

    @Column({ nullable: true, comment: 'Reseller ID - isolate clients by reseller' })
    resellerId?: string;

    // Relations
    @ManyToOne(() => Offer, { eager: true, nullable: true })
    @JoinColumn({ name: 'offer_id' })
    offer?: Offer;

    @OneToOne(() => ClientCustomization, (custom) => custom.client, { nullable: true, cascade: true })
    customization?: ClientCustomization;

    @OneToMany(() => ClientModule, (mod) => mod.client, { cascade: true })
    modules?: ClientModule[];

    @OneToOne(() => ClientAuthConfig, (auth) => auth.client, { nullable: true, cascade: true })
    authConfig?: ClientAuthConfig;

    @OneToMany(() => ClientDomain, (domain) => domain.client, { cascade: true })
    domains?: ClientDomain[];

    // Metadata
    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    deactivatedAt?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
