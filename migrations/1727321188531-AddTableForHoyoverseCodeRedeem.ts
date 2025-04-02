import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableForHoyoverseCodeRedeem1727321188531 implements MigrationInterface {
    name = 'AddTableForHoyoverseCodeRedeem1727321188531';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "TBL_HOYOVERSE_CODE" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "gameName" character varying NOT NULL, "isActivate" boolean NOT NULL, CONSTRAINT "PK_f9e8f876be85d8c4295f34e0e10" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(`CREATE INDEX "IDX_4d31645f3a5576c34462365050" ON "TBL_HOYOVERSE_CODE" ("code") `);
        await queryRunner.query(`CREATE INDEX "IDX_0824566934eaefbc78e0ca05ab" ON "TBL_HOYOVERSE_CODE" ("gameName") `);
        await queryRunner.query(
            `CREATE TABLE "TBL_HOYOVERSE_REDEEM" ("id" SERIAL NOT NULL, "hoyoverseId" integer NOT NULL, "code" character varying NOT NULL, "gameName" character varying NOT NULL, "redeemAt" integer NOT NULL, CONSTRAINT "PK_48fdcdaadc33f9e1490d0ccadd8" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(`CREATE INDEX "IDX_84d9d377264f0549daadc00f40" ON "TBL_HOYOVERSE_REDEEM" ("hoyoverseId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a258c8cebd98e6f94192965604" ON "TBL_HOYOVERSE_REDEEM" ("code") `);
        await queryRunner.query(`CREATE INDEX "IDX_c788d49180ab474fde7ab3df74" ON "TBL_HOYOVERSE_REDEEM" ("gameName") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c788d49180ab474fde7ab3df74"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a258c8cebd98e6f94192965604"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_84d9d377264f0549daadc00f40"`);
        await queryRunner.query(`DROP TABLE "TBL_HOYOVERSE_REDEEM"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0824566934eaefbc78e0ca05ab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4d31645f3a5576c34462365050"`);
        await queryRunner.query(`DROP TABLE "TBL_HOYOVERSE_CODE"`);
    }
}
