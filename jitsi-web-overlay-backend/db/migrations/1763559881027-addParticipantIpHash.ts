import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParticipantIpHash1763559881027 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`ip_hash\` VARCHAR(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`conference_uid\` VARCHAR(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_dce36d9217702bd116aa96cf064\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP INDEX \`FK_dce36d9217702bd116aa96cf064\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`conference_id\``);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_31d1dd99eff7b6f3bc9d8bcff28\` FOREIGN KEY (conference_uid) REFERENCES \`conferences\`(\`uid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_31d1dd99eff7b6f3bc9d8bcff28\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`conference_uid\``);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD COLUMN \`conference_id\` INT(11) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_31d1dd99eff7b6f3bc9d8bcff28\` FOREIGN KEY (\`conference_id\`) REFERENCES \`conferences\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD INDEX \`FK_dce36d9217702bd116aa96cf064\` (\`conference_id\`)`);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`ip_hash\``);
    }

}
