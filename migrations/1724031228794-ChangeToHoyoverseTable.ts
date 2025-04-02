import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeToHoyoverseTable1724031228794 implements MigrationInterface {
    name = 'ChangeToHoyoverseTable1724031228794';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_d8434623cf08fdbd6db87db84b"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE" DROP COLUMN "game"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE" DROP COLUMN "cookies"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE" ADD "cookie" text NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "TBL_HOYOVERSE" ADD "lastUpdated" integer NOT NULL DEFAULT (to_char(CURRENT_DATE, 'YYYYMMDD')::integer)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE" DROP COLUMN "lastUpdated"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE" DROP COLUMN "cookie"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE" ADD "cookies" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE" ADD "game" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_d8434623cf08fdbd6db87db84b" ON "TBL_HOYOVERSE" ("game") `);
    }
}
