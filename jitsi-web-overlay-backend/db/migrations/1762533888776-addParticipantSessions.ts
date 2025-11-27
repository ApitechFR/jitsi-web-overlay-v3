import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParticipantSessions1762533888776 implements MigrationInterface {
    name = 'AddParticipantSessions1762533888776'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_1427a77e06023c250ed3794a1ba\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_dce36d9217702bd116aa96cf064\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``);
        await queryRunner.query(`CREATE TABLE \`participant_sessions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`join_at\` timestamp NOT NULL, \`leave_at\` timestamp NULL, \`ip\` varchar(64) NULL, \`user_agent\` text NULL, \`was_moderator\` tinyint NOT NULL DEFAULT 0, \`participant_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`conference_organizers\` (\`user_id\` int NOT NULL, \`conference_id\` int NOT NULL, INDEX \`IDX_8241ea50589b5caf38b6d9545c\` (\`user_id\`), INDEX \`IDX_0df2b3294cc79cc1a3614fe48a\` (\`conference_id\`), PRIMARY KEY (\`user_id\`, \`conference_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`password\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`update_at\``);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`uid\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD UNIQUE INDEX \`IDX_80b1a21db353789282ddabbbd1\` (\`uid\`)`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`email\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`phone\` varchar(32) NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`display_name\` varchar(128) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`role\` enum ('ATTENDEE', 'MODERATOR', 'SPEAKER', 'RECORDER', 'VISITOR') NOT NULL DEFAULT 'ATTENDEE'`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`status\` enum ('INVITED', 'CONFIRMED', 'DECLINED', 'JOINED', 'LEFT', 'BANNED') NOT NULL DEFAULT 'INVITED'`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`inviteMethod\` enum ('EMAIL', 'SMS', 'LINK', 'API', 'MANUAL') NOT NULL DEFAULT 'LINK'`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD \`invited_by_user_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`uid\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_6e20ce1edf0678a09f1963f958\` (\`uid\`)`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`display_name\` varchar(128) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`password_hash\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`phone\` varchar(32) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`avatar_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`role\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`provider\` enum ('LOCAL', 'OIDC', 'LDAP') NOT NULL DEFAULT 'OIDC'`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`external_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`is_active\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP FOREIGN KEY \`FK_e1fccb77e9acab294cf7102e78e\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD \`status\` enum ('started', 'ongoing', 'completed', 'SCHEDULED', 'ENDED', 'DRAFT') NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`conferences\` CHANGE \`room_uid\` \`room_uid\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` CHANGE \`conference_id\` \`conference_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`email\` \`email\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD CONSTRAINT \`FK_e1fccb77e9acab294cf7102e78e\` FOREIGN KEY (\`room_uid\`) REFERENCES \`rooms\`(\`uid\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participant_sessions\` ADD CONSTRAINT \`FK_d8c95ae40b20969359a024adc6c\` FOREIGN KEY (\`participant_id\`) REFERENCES \`participants\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_dce36d9217702bd116aa96cf064\` FOREIGN KEY (\`conference_id\`) REFERENCES \`conferences\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_1427a77e06023c250ed3794a1ba\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_506a50653243c7f80ee9889e8c7\` FOREIGN KEY (\`invited_by_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conference_organizers\` ADD CONSTRAINT \`FK_8241ea50589b5caf38b6d9545c8\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`conference_organizers\` ADD CONSTRAINT \`FK_0df2b3294cc79cc1a3614fe48a8\` FOREIGN KEY (\`conference_id\`) REFERENCES \`conferences\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`conference_organizers\` DROP FOREIGN KEY \`FK_0df2b3294cc79cc1a3614fe48a8\``);
        await queryRunner.query(`ALTER TABLE \`conference_organizers\` DROP FOREIGN KEY \`FK_8241ea50589b5caf38b6d9545c8\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_506a50653243c7f80ee9889e8c7\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_1427a77e06023c250ed3794a1ba\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP FOREIGN KEY \`FK_dce36d9217702bd116aa96cf064\``);
        await queryRunner.query(`ALTER TABLE \`participant_sessions\` DROP FOREIGN KEY \`FK_d8c95ae40b20969359a024adc6c\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP FOREIGN KEY \`FK_e1fccb77e9acab294cf7102e78e\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`email\` \`email\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`participants\` CHANGE \`conference_id\` \`conference_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`conferences\` CHANGE \`room_uid\` \`room_uid\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`conferences\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD \`status\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`conferences\` ADD CONSTRAINT \`FK_e1fccb77e9acab294cf7102e78e\` FOREIGN KEY (\`room_uid\`) REFERENCES \`rooms\`(\`uid\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`is_active\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`external_id\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`provider\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`role\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`avatar_url\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`phone\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`password_hash\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`display_name\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_6e20ce1edf0678a09f1963f958\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`uid\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`invited_by_user_id\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`inviteMethod\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`role\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`display_name\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`phone\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`email\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP INDEX \`IDX_80b1a21db353789282ddabbbd1\``);
        await queryRunner.query(`ALTER TABLE \`participants\` DROP COLUMN \`uid\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`update_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`password\` varchar(255) NOT NULL`);
        await queryRunner.query(`DROP INDEX \`IDX_0df2b3294cc79cc1a3614fe48a\` ON \`conference_organizers\``);
        await queryRunner.query(`DROP INDEX \`IDX_8241ea50589b5caf38b6d9545c\` ON \`conference_organizers\``);
        await queryRunner.query(`DROP TABLE \`conference_organizers\``);
        await queryRunner.query(`DROP TABLE \`participant_sessions\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\` (\`username\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\` (\`email\`)`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_dce36d9217702bd116aa96cf064\` FOREIGN KEY (\`conference_id\`) REFERENCES \`conferences\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`participants\` ADD CONSTRAINT \`FK_1427a77e06023c250ed3794a1ba\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
