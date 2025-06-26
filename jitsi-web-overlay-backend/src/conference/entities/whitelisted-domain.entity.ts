import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'whitelisted_domains' })
export class WhiteListedDomainsEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    owner: string;

    @Column('simple-array')
    domains: string[];
}
