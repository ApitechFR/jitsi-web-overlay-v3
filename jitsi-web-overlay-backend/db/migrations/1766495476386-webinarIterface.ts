import { MigrationInterface, QueryRunner } from "typeorm";

export class WebinarIterface1766495476386 implements MigrationInterface {
    name = 'WebinarIterface1766495476386'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasWebinarInvitations = await queryRunner.hasTable('webinar_invitations');
        if (!hasWebinarInvitations) {
            await queryRunner.query(`CREATE TABLE \`webinar_invitations\` (\`id\` uuid NOT NULL, \`token\` varchar(32) NOT NULL, \`roomName\` varchar(255) NOT NULL, \`jwt\` text NOT NULL, \`type\` varchar(255) NOT NULL DEFAULT 'visitor', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expiresAt\` timestamp NULL, UNIQUE INDEX \`IDX_a5bc08f8b51bbd2977d0618e15\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        }
        // Suppression des CREATE TABLE en doublon pour toutes les autres tables
        // Suppression des ajouts de contraintes de clés étrangères en doublon
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
