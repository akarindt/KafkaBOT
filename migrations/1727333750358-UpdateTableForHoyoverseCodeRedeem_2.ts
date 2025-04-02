import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTableForHoyoverseCodeRedeem21727333750358 implements MigrationInterface {
    name = 'UpdateTableForHoyoverseCodeRedeem21727333750358';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" ADD "rewards" character varying array NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" DROP COLUMN "rewards"`);
    }
}
