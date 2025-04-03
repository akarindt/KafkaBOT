import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('TBL_WUWA_SUBSCRIBE')
export default class WuwaSubscribe {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('varchar')
    @Index()
    userDiscordId: string;
}
