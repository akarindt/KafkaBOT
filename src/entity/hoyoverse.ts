import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('TBL_HOYOVERSE')
export default class Hoyoverse {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar')
    @Index()
    userDiscordId: string

    @Column('text')
    cookie: string

    @Column('int')
    lastUpdated: number
}
