import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHoyoverseTable1723882328063 implements MigrationInterface {
    name = 'AddHoyoverseTable1723882328063'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "TBL_HOYOVERSE" ("id" SERIAL NOT NULL, "userDiscordId" character varying NOT NULL, "game" character varying NOT NULL, "cookies" text NOT NULL, CONSTRAINT "PK_4336237ca928715d5fe678206b9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_15601488d1b68d0102d1bd24fa" ON "TBL_HOYOVERSE" ("userDiscordId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d8434623cf08fdbd6db87db84b" ON "TBL_HOYOVERSE" ("game") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_d8434623cf08fdbd6db87db84b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_15601488d1b68d0102d1bd24fa"`);
        await queryRunner.query(`DROP TABLE "TBL_HOYOVERSE"`);
    }

}
