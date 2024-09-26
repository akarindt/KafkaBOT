import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTableForHoyoverseCodeRedeem31727337109767 implements MigrationInterface {
    name = 'UpdateTableForHoyoverseCodeRedeem31727337109767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" ADD "server" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" ADD CONSTRAINT "UQ_4d31645f3a5576c34462365050c" UNIQUE ("code")`);
        await queryRunner.query(`CREATE INDEX "IDX_d36d4233600154a5927bb3e525" ON "TBL_HOYOVERSE_CODE" ("server") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_d36d4233600154a5927bb3e525"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" DROP CONSTRAINT "UQ_4d31645f3a5576c34462365050c"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" DROP COLUMN "server"`);
    }

}
