import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1759846318006 implements MigrationInterface {
    name = 'InitSchema1759846318006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`update_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`admin\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`participants\` (\`id\` int NOT NULL AUTO_INCREMENT, \`conference_id\` int NULL, \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`rooms\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uid\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`created_by\` varchar(255) NOT NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_5634add9cf083b937fe9a891df\` (\`uid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`conferences\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`start_time\` timestamp NOT NULL, \`end_time\` timestamp NULL, \`uid\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`room_uid\` varchar(255) NULL, UNIQUE INDEX \`IDX_34698a3f1ba172732f79cc6765\` (\`uid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`replay\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uid\` uuid NULL, \`file_path\` varchar(255) NULL, \`status\` enum ('started', 'uploading-rsync', 'uploaded-rsync', 'error-uploading-rsync', 'terminated') NULL, \`message\` varchar(255) NULL, \`conference_name\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`conference_uid\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`feedback_type\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`feedback\` (\`id\` int NOT NULL AUTO_INCREMENT, \`conferenceUuid\` char(36) NOT NULL, \`date\` datetime NOT NULL, \`userAgent\` varchar(255) NOT NULL, \`reponse\` text NOT NULL, \`feedbackTemplateId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`feedback_template\` (\`id\` int NOT NULL AUTO_INCREMENT, \`label\` varchar(255) NOT NULL, \`choices\` json NULL, \`organization\` varchar(255) NULL, \`deleted_at\` datetime NULL, \`typeId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`register_event\` (\`id\` int NOT NULL AUTO_INCREMENT, \`confname\` varchar(255) NOT NULL, \`eventid\` varchar(255) NOT NULL, \`jwt\` varchar(255) NOT NULL, \`uploadCallbackUrl\` varchar(255) NOT NULL, \`uploadCallbackDomainUrl\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`whitelisted_domains\` (\`id\` int NOT NULL AUTO_INCREMENT, \`owner\` varchar(255) NOT NULL, \`domains\` text NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_dce36d9217702bd116aa96cf064\` FOREIGN KEY (\`conference_id\`) REFERENCES \`conferences\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_1427a77e06023c250ed3794a1ba\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD CONSTRAINT \`FK_e1fccb77e9acab294cf7102e78e\` FOREIGN KEY (\`room_uid\`) REFERENCES \`rooms\`(\`uid\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`replay\` ADD CONSTRAINT \`FK_9cc2d03ec8fdc4ab476ed30c5a7\` FOREIGN KEY (\`conference_uid\`) REFERENCES \`conferences\`(\`uid\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`feedback\` ADD CONSTRAINT \`FK_e1db7b8431bd46b1a1a5d1d87c0\` FOREIGN KEY (\`feedbackTemplateId\`) REFERENCES \`feedback_template\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`feedback_template\` ADD CONSTRAINT \`FK_363aa2c887ad04bc60e7e42d7ec\` FOREIGN KEY (\`typeId\`) REFERENCES \`feedback_type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`feedback_template\` DROP FOREIGN KEY \`FK_363aa2c887ad04bc60e7e42d7ec\``);
        await queryRunner.query(`ALTER TABLE \`feedback\` DROP FOREIGN KEY \`FK_e1db7b8431bd46b1a1a5d1d87c0\``);
        await queryRunner.query(`ALTER TABLE \`replay\` DROP FOREIGN KEY \`FK_9cc2d03ec8fdc4ab476ed30c5a7\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP FOREIGN KEY \`FK_e1fccb77e9acab294cf7102e78e\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_1427a77e06023c250ed3794a1ba\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_dce36d9217702bd116aa96cf064\``);
        await queryRunner.query(`DROP TABLE \`whitelisted_domains\``);
        await queryRunner.query(`DROP TABLE \`register_event\``);
        await queryRunner.query(`DROP TABLE \`feedback_template\``);
        await queryRunner.query(`DROP TABLE \`feedback\``);
        await queryRunner.query(`DROP TABLE \`feedback_type\``);
        await queryRunner.query(`DROP TABLE \`replay\``);
        await queryRunner.query(`DROP INDEX \`IDX_34698a3f1ba172732f79cc6765\` ON \`conferences\``);
        await queryRunner.query(`DROP TABLE \`conferences\``);
        await queryRunner.query(`DROP INDEX \`IDX_5634add9cf083b937fe9a891df\` ON \`rooms\``);
        await queryRunner.query(`DROP TABLE \`rooms\``);
        await queryRunner.query(`DROP TABLE \`participants\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
