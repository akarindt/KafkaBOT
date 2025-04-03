import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('TBL_WUWA_NOTIFY')
export default class WuwaNotify {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('int', { primary: true })
    @Index()
    wuwaSubscribeId: number;

    @Column('varchar', { primary: true })
    @Index()
    code: string;
}
