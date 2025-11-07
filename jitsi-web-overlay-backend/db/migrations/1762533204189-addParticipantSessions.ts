import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParticipantSessions1762533204189 implements MigrationInterface {
    name = 'AddParticipantSessions1762533204189'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`uq_participant_conf_email\` ON \`participants\``);
        await queryRunner.query(`DROP INDEX \`uq_participant_conf_user\` ON \`participants\``);
        await queryRunner.query(`DROP INDEX \`ix_participants_status\` ON \`participants\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`ix_participants_status\` ON \`participants\` (\`status\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`uq_participant_conf_user\` ON \`participants\` (\`conference_id\`, \`user_id\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`uq_participant_conf_email\` ON \`participants\` (\`conference_id\`, \`email\`)`);
    }

}
