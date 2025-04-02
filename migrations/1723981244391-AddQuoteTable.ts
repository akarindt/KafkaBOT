import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuoteTable1723981244391 implements MigrationInterface {
    name = 'AddQuoteTable1723981244391';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "TBL_QUOTE" ("id" SERIAL NOT NULL, "serverId" character varying NOT NULL, "indentifier" character varying NOT NULL, "content" character varying NOT NULL, CONSTRAINT "PK_6ecd0154c7038065df3ebb8d60d" PRIMARY KEY ("id"))`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "TBL_QUOTE"`);
    }
}
