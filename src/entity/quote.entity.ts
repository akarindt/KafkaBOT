import { PrimaryGeneratedColumn, Entity, Column, Index } from 'typeorm';

@Entity('TBL_QUOTE')
export default class Quote {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Index()
    @Column('varchar')
    serverId: string;

    @Index()
    @Column('varchar')
    identifier: string;

    @Column('varchar')
    content: string;
}
