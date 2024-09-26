import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTableForHoyoverseCodeRedeem51727337647711 implements MigrationInterface {
    name = 'UpdateTableForHoyoverseCodeRedeem51727337647711'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_4d31645f3a5576c34462365050"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0824566934eaefbc78e0ca05ab"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" DROP CONSTRAINT "PK_f9e8f876be85d8c4295f34e0e10"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" ADD CONSTRAINT "PK_ffee1d83dfd9df2cceb1b670e9d" PRIMARY KEY ("code", "gameName")`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" DROP CONSTRAINT "UQ_4d31645f3a5576c34462365050c"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" DROP CONSTRAINT "UQ_0824566934eaefbc78e0ca05ab3"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" ADD CONSTRAINT "UQ_0824566934eaefbc78e0ca05ab3" UNIQUE ("gameName")`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" ADD CONSTRAINT "UQ_4d31645f3a5576c34462365050c" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" DROP CONSTRAINT "PK_ffee1d83dfd9df2cceb1b670e9d"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE_CODE" ADD CONSTRAINT "PK_f9e8f876be85d8c4295f34e0e10" PRIMARY KEY ("id")`);
        await queryRunner.query(`CREATE INDEX "IDX_0824566934eaefbc78e0ca05ab" ON "TBL_HOYOVERSE_CODE" ("gameName") `);
        await queryRunner.query(`CREATE INDEX "IDX_4d31645f3a5576c34462365050" ON "TBL_HOYOVERSE_CODE" ("code") `);
    }

}
