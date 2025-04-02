import { Index, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('TBL_KEYWORD')
export default class NSFWKeyword {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Index()
    @Column('text')
    keyword: string;
}
