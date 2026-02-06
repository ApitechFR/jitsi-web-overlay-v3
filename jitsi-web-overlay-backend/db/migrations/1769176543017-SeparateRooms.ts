import { MigrationInterface, QueryRunner } from "typeorm";

export class SeparateRooms1769176543017 implements MigrationInterface {
    name = 'SeparateRooms1769176543017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP FOREIGN KEY \`FK_e1fccb77e9acab294cf7102e78e\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` CHANGE \`room_uid\` \`room_uid\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD CONSTRAINT \`FK_e1fccb77e9acab294cf7102e78e\` FOREIGN KEY (\`room_uid\`) REFERENCES \`rooms\`(\`uid\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP FOREIGN KEY \`FK_e1fccb77e9acab294cf7102e78e\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` CHANGE \`room_uid\` \`room_uid\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD CONSTRAINT \`FK_e1fccb77e9acab294cf7102e78e\` FOREIGN KEY (\`room_uid\`) REFERENCES \`rooms\`(\`uid\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
