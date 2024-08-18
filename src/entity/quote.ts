import { PrimaryGeneratedColumn, Entity, Column, Index } from 'typeorm';

@Entity('TBL_QUOTE')
export default class Quote {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar')
    serverId: string;

    @Column('varchar')
    indentifier: string;

    @Column('varchar')
    content: string;
}
