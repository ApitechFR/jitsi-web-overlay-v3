import { MigrationInterface, QueryRunner } from "typeorm";

export class WebinarIterface1766495476386 implements MigrationInterface {
    name = 'WebinarIterface1766495476386'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`webinar_invitations\` (\`id\` uuid NOT NULL, \`token\` varchar(32) NOT NULL, \`roomName\` varchar(255) NOT NULL, \`jwt\` text NOT NULL, \`type\` varchar(255) NOT NULL DEFAULT 'visitor', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expiresAt\` timestamp NULL, UNIQUE INDEX \`IDX_a5bc08f8b51bbd2977d0618e15\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`register_event\` (\`id\` int NOT NULL AUTO_INCREMENT, \`confname\` varchar(255) NOT NULL, \`eventid\` varchar(255) NOT NULL, \`jwt\` varchar(255) NOT NULL, \`uploadCallbackUrl\` varchar(255) NOT NULL, \`uploadCallbackDomainUrl\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uid\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`username\` varchar(255) NULL, \`display_name\` varchar(128) NOT NULL, \`password_hash\` varchar(255) NULL, \`phone\` varchar(32) NULL, \`avatar_url\` varchar(255) NULL, \`role\` varchar(64) NULL, \`admin\` tinyint NOT NULL DEFAULT 0, \`provider\` enum ('LOCAL', 'OIDC', 'LDAP') NOT NULL DEFAULT 'OIDC', \`external_id\` varchar(255) NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_6e20ce1edf0678a09f1963f958\` (\`uid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`participant_sessions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`join_at\` timestamp NOT NULL, \`leave_at\` timestamp NULL, \`ip\` varchar(64) NULL, \`user_agent\` text NULL, \`was_moderator\` tinyint NOT NULL DEFAULT 0, \`participant_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`participants\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uid\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`phone\` varchar(32) NULL, \`display_name\` varchar(128) NOT NULL, \`role\` enum ('ATTENDEE', 'MODERATOR', 'SPEAKER', 'RECORDER', 'VISITOR') NOT NULL DEFAULT 'ATTENDEE', \`status\` enum ('INVITED', 'CONFIRMED', 'DECLINED', 'JOINED', 'LEFT', 'BANNED') NOT NULL DEFAULT 'INVITED', \`ip_hash\` varchar(255) NULL, \`inviteMethod\` enum ('EMAIL', 'SMS', 'LINK', 'API', 'MANUAL') NOT NULL DEFAULT 'LINK', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`conference_uid\` varchar(255) NOT NULL, \`user_uid\` varchar(255) NULL, \`invited_by_user_id\` int NULL, UNIQUE INDEX \`IDX_80b1a21db353789282ddabbbd1\` (\`uid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`replay\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uid\` uuid NULL, \`file_path\` varchar(255) NULL, \`status\` enum ('started', 'uploading-rsync', 'uploaded-rsync', 'error-uploading-rsync', 'terminated') NULL, \`message\` varchar(255) NULL, \`conference_name\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`conference_uid\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`conferences\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uid\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`start_time\` timestamp NOT NULL, \`end_time\` timestamp NULL, \`status\` enum ('started', 'ongoing', 'completed', 'SCHEDULED', 'ENDED', 'DRAFT') NOT NULL DEFAULT 'DRAFT', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`room_uid\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_34698a3f1ba172732f79cc6765\` (\`uid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`rooms\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uid\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`created_by\` varchar(255) NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_5634add9cf083b937fe9a891df\` (\`uid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`feedback_type\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`feedback\` (\`id\` int NOT NULL AUTO_INCREMENT, \`conferenceUuid\` char(36) NOT NULL, \`date\` datetime NOT NULL, \`userAgent\` varchar(255) NOT NULL, \`reponse\` text NOT NULL, \`feedbackTemplateId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`feedback_template\` (\`id\` int NOT NULL AUTO_INCREMENT, \`label\` varchar(255) NOT NULL, \`choices\` json NULL, \`organization\` varchar(255) NULL, \`deleted_at\` datetime NULL, \`typeId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`whitelisted_domains\` (\`id\` int NOT NULL AUTO_INCREMENT, \`owner\` varchar(255) NOT NULL, \`domains\` text NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`conference_organizers\` (\`user_id\` int NOT NULL, \`conference_id\` int NOT NULL, INDEX \`IDX_8241ea50589b5caf38b6d9545c\` (\`user_id\`), INDEX \`IDX_0df2b3294cc79cc1a3614fe48a\` (\`conference_id\`), PRIMARY KEY (\`user_id\`, \`conference_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`participant_sessions\` ADD CONSTRAINT \`FK_d8c95ae40b20969359a024adc6c\` FOREIGN KEY (\`participant_id\`) REFERENCES \`participants\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_31d1dd99eff7b6f3bc9d8bcff28\` FOREIGN KEY (\`conference_uid\`) REFERENCES \`conferences\`(\`uid\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_ad8d4503cd26e1728c53c49983d\` FOREIGN KEY (\`user_uid\`) REFERENCES \`users\`(\`uid\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_506a50653243c7f80ee9889e8c7\` FOREIGN KEY (\`invited_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`replay\` ADD CONSTRAINT \`FK_9cc2d03ec8fdc4ab476ed30c5a7\` FOREIGN KEY (\`conference_uid\`) REFERENCES \`conferences\`(\`uid\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD CONSTRAINT \`FK_e1fccb77e9acab294cf7102e78e\` FOREIGN KEY (\`room_uid\`) REFERENCES \`rooms\`(\`uid\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`feedback\` ADD CONSTRAINT \`FK_e1db7b8431bd46b1a1a5d1d87c0\` FOREIGN KEY (\`feedbackTemplateId\`) REFERENCES \`feedback_template\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`feedback_template\` ADD CONSTRAINT \`FK_363aa2c887ad04bc60e7e42d7ec\` FOREIGN KEY (\`typeId\`) REFERENCES \`feedback_type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conference_organizers\` ADD CONSTRAINT \`FK_8241ea50589b5caf38b6d9545c8\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`conference_organizers\` ADD CONSTRAINT \`FK_0df2b3294cc79cc1a3614fe48a8\` FOREIGN KEY (\`conference_id\`) REFERENCES \`conferences\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`conference_organizers\` DROP FOREIGN KEY \`FK_0df2b3294cc79cc1a3614fe48a8\``);
        await queryRunner.query(`ALTER TABLE \`conference_organizers\` DROP FOREIGN KEY \`FK_8241ea50589b5caf38b6d9545c8\``);
        await queryRunner.query(`ALTER TABLE \`feedback_template\` DROP FOREIGN KEY \`FK_363aa2c887ad04bc60e7e42d7ec\``);
        await queryRunner.query(`ALTER TABLE \`feedback\` DROP FOREIGN KEY \`FK_e1db7b8431bd46b1a1a5d1d87c0\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP FOREIGN KEY \`FK_e1fccb77e9acab294cf7102e78e\``);
        await queryRunner.query(`ALTER TABLE \`replay\` DROP FOREIGN KEY \`FK_9cc2d03ec8fdc4ab476ed30c5a7\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_506a50653243c7f80ee9889e8c7\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_ad8d4503cd26e1728c53c49983d\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_31d1dd99eff7b6f3bc9d8bcff28\``);
        await queryRunner.query(`ALTER TABLE \`participant_sessions\` DROP FOREIGN KEY \`FK_d8c95ae40b20969359a024adc6c\``);
        await queryRunner.query(`DROP INDEX \`IDX_0df2b3294cc79cc1a3614fe48a\` ON \`conference_organizers\``);
        await queryRunner.query(`DROP INDEX \`IDX_8241ea50589b5caf38b6d9545c\` ON \`conference_organizers\``);
        await queryRunner.query(`DROP TABLE \`conference_organizers\``);
        await queryRunner.query(`DROP TABLE \`whitelisted_domains\``);
        await queryRunner.query(`DROP TABLE \`feedback_template\``);
        await queryRunner.query(`DROP TABLE \`feedback\``);
        await queryRunner.query(`DROP TABLE \`feedback_type\``);
        await queryRunner.query(`DROP INDEX \`IDX_5634add9cf083b937fe9a891df\` ON \`rooms\``);
        await queryRunner.query(`DROP TABLE \`rooms\``);
        await queryRunner.query(`DROP INDEX \`IDX_34698a3f1ba172732f79cc6765\` ON \`conferences\``);
        await queryRunner.query(`DROP TABLE \`conferences\``);
        await queryRunner.query(`DROP TABLE \`replay\``);
        await queryRunner.query(`DROP INDEX \`IDX_80b1a21db353789282ddabbbd1\` ON \`participants\``);
        await queryRunner.query(`DROP TABLE \`participants\``);
        await queryRunner.query(`DROP TABLE \`participant_sessions\``);
        await queryRunner.query(`DROP INDEX \`IDX_6e20ce1edf0678a09f1963f958\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`register_event\``);
        await queryRunner.query(`DROP INDEX \`IDX_a5bc08f8b51bbd2977d0618e15\` ON \`webinar_invitations\``);
        await queryRunner.query(`DROP TABLE \`webinar_invitations\``);
    }

}
