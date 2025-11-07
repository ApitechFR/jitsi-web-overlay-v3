import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveIndexes1762529567886 implements MigrationInterface {
    name = 'RemoveIndexes1762529567886'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`ix_sessions_participant\` ON \`participant_sessions\``);
        await queryRunner.query(`DROP INDEX \`uq_participant_conf_email\` ON \`participants\``);
        await queryRunner.query(`DROP INDEX \`uq_participant_conf_user\` ON \`participants\``);
        await queryRunner.query(`DROP INDEX \`ix_participants_status\` ON \`participants\``);
        await queryRunner.query(`DROP INDEX \`ix_participants_conference\` ON \`participants\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`ix_participants_conference\` ON \`participants\` (\`conference_id\`)`);
        await queryRunner.query(`CREATE INDEX \`ix_participants_status\` ON \`participants\` (\`status\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`uq_participant_conf_user\` ON \`participants\` (\`conference_id\`, \`user_id\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`uq_participant_conf_email\` ON \`participants\` (\`conference_id\`, \`email\`)`);
        await queryRunner.query(`CREATE INDEX \`ix_sessions_participant\` ON \`participant_sessions\` (\`participant_id\`)`);
    }

}
