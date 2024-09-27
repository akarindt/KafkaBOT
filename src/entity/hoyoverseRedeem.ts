import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('TBL_HOYOVERSE_REDEEM')
export default class HoyoverseRedeem {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('int')
    @Index()
    hoyoverseId: number;

    @Column('varchar')
    @Index()
    code: string;

    @Column('varchar')
    @Index()
    gameName: string;

    @Column('int')
    redeemAt: number;
}
