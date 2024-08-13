import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNsfwKeywordTable1723516622790 implements MigrationInterface {
    name = 'AddNsfwKeywordTable1723516622790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "TBL_KEYWORD" ("id" SERIAL NOT NULL, "keyword" text NOT NULL, CONSTRAINT "PK_26297114ff70939167e6f37d0a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f87e46485978415a8da7055538" ON "TBL_KEYWORD" ("keyword") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f87e46485978415a8da7055538"`);
        await queryRunner.query(`DROP TABLE "TBL_KEYWORD"`);
    }

}
