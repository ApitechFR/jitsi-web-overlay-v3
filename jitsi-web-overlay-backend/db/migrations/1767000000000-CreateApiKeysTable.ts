import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateApiKeysTable1767000000000 implements MigrationInterface {
    name = 'CreateApiKeysTable1767000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'api_keys',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'keyHash',
                        type: 'varchar',
                        length: '255',
                        comment: 'PBKDF2 hash of the API key - for constant-time validation',
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP(6)',
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('api_keys');
    }
}
