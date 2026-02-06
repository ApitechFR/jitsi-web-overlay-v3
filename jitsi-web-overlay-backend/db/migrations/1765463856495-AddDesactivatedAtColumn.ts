import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDesactivatedAtColumn1765463856495 implements MigrationInterface {
    name = 'AddDesactivatedAtColumn1765463856495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD \`is_active\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD \`desactivated_at\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`desactivated_at\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`desactivated_at\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP COLUMN \`desactivated_at\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP COLUMN \`is_active\``);
    }

}
