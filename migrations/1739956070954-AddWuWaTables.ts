import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWuWaTables1739956070954 implements MigrationInterface {
    name = 'AddWuWaTables1739956070954'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "TBL_WUWA_NOTIFY" ("id" SERIAL NOT NULL, "wuwaSubscribeId" integer NOT NULL, "code" character varying NOT NULL, CONSTRAINT "PK_20c8c4f968cce64d77d2ea18246" PRIMARY KEY ("id", "wuwaSubscribeId", "code"))`);
        await queryRunner.query(`CREATE INDEX "IDX_01570b50d7991ad066ceb2656c" ON "TBL_WUWA_NOTIFY" ("wuwaSubscribeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_16b0d5f6afbc77d202a1999e82" ON "TBL_WUWA_NOTIFY" ("code") `);
        await queryRunner.query(`CREATE TABLE "TBL_WUWA_SUBSCRIBE" ("id" SERIAL NOT NULL, "userDiscordId" character varying NOT NULL, CONSTRAINT "PK_8d0d00f20b781b8689cbbe90b70" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_449263b7c7e47a122d8c8701f7" ON "TBL_WUWA_SUBSCRIBE" ("userDiscordId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_449263b7c7e47a122d8c8701f7"`);
        await queryRunner.query(`DROP TABLE "TBL_WUWA_SUBSCRIBE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_16b0d5f6afbc77d202a1999e82"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01570b50d7991ad066ceb2656c"`);
        await queryRunner.query(`DROP TABLE "TBL_WUWA_NOTIFY"`);
    }

}
