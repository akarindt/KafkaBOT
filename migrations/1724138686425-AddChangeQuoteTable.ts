import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChangeQuoteTable1724138686425 implements MigrationInterface {
    name = 'AddChangeQuoteTable1724138686425'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TBL_QUOTE" RENAME COLUMN "indentifier" TO "identifier"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE" ALTER COLUMN "lastUpdated" DROP DEFAULT`);
        await queryRunner.query(`CREATE INDEX "IDX_e91b1b6c412e002df516ecbb45" ON "TBL_QUOTE" ("serverId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b7b4ac92628b81d483375024a1" ON "TBL_QUOTE" ("identifier") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b7b4ac92628b81d483375024a1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e91b1b6c412e002df516ecbb45"`);
        await queryRunner.query(`ALTER TABLE "TBL_HOYOVERSE" ALTER COLUMN "lastUpdated" SET DEFAULT (to_char((CURRENT_DATE), 'YYYYMMDD'))`);
        await queryRunner.query(`ALTER TABLE "TBL_QUOTE" RENAME COLUMN "identifier" TO "indentifier"`);
    }

}
