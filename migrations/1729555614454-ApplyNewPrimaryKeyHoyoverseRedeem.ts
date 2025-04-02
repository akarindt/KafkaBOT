import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApplyNewPrimaryKeyHoyoverseRedeem1729555614454 implements MigrationInterface {
    name = 'ApplyNewPrimaryKeyHoyoverseRedeem1729555614454';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_REDEEM" DROP CONSTRAINT "PK_48fdcdaadc33f9e1490d0ccadd8"`);
        await queryRunner.query(
            `ALTER TABLE "TBL_HOYOVERSE_REDEEM" ADD CONSTRAINT "PK_1407690e0b166402cff78f3146b" PRIMARY KEY ("id", "hoyoverseId", "code")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_REDEEM" DROP CONSTRAINT "PK_1407690e0b166402cff78f3146b"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_REDEEM" ADD CONSTRAINT "PK_48fdcdaadc33f9e1490d0ccadd8" PRIMARY KEY ("id")`);
    }
}
