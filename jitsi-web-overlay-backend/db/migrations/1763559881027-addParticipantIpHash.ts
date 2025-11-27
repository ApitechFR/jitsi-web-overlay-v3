import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParticipantIpHash1763559881027 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`ip_hash\` VARCHAR(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`ip_hash\``);
    }

}
