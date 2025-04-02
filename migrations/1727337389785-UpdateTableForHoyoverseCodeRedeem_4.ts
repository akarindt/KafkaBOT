import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTableForHoyoverseCodeRedeem41727337389785 implements MigrationInterface {
    name = 'UpdateTableForHoyoverseCodeRedeem41727337389785';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" ADD CONSTRAINT "UQ_0824566934eaefbc78e0ca05ab3" UNIQUE ("gameName")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" DROP CONSTRAINT "UQ_0824566934eaefbc78e0ca05ab3"`);
    }
}
