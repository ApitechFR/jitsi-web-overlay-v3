import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdmin1762266834541 implements MigrationInterface {
    name = 'AddAdmin1762266834541'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`admin\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`admin\``);
    }

}
