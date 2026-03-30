import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsActiveReplay1773672711550 implements MigrationInterface {
    name = 'AddIsActiveReplay1773672711550'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`replay\` ADD \`is_active\` tinyint NOT NULL DEFAULT 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`replay\` DROP COLUMN \`is_active\``);
    }

}
