import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceUserIdWithUid1763565576673 implements MigrationInterface {

public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`participants\`
            DROP FOREIGN KEY \`FK_1427a77e06023c250ed3794a1ba\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`participants\`
            DROP INDEX \`FK_1427a77e06023c250ed3794a1ba\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`participants\`
            DROP COLUMN \`user_id\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`participants\`
            ADD \`user_uid\` VARCHAR(255) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`participants\`
            ADD CONSTRAINT \`FK_ad8d4503cd26e1728c53c49983d\`
            FOREIGN KEY (\`user_uid\`)
            REFERENCES \`users\`(\`uid\`)
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`participants\`
            DROP FOREIGN KEY \`FK_ad8d4503cd26e1728c53c49983d\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`participants\`
            DROP COLUMN \`user_uid\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`participants\`
            ADD \`user_id\` INT(11) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`participants\`
            ADD CONSTRAINT \`FK_1427a77e06023c250ed3794a1ba\`
            FOREIGN KEY (\`user_id\`)
            REFERENCES \`users\`(\`id\`)
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`participants\`
            ADD INDEX \`FK_1427a77e06023c250ed3794a1ba\` (\`user_id\`)
        `);
    }

}
