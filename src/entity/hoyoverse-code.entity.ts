import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('TBL_HOYOVERSE_CODE')
export default class HoyoverseCode {
    @PrimaryColumn('varchar')
    code: string;

    @PrimaryColumn('varchar')
    gameName: string;

    @Column('varchar')
    @Index()
    server: string;

    @Column('boolean')
    isActivate: boolean;

    @Column('varchar', { array: true })
    rewards: string[];
}
