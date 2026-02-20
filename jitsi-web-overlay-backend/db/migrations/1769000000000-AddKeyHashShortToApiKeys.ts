import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddKeyHashShortToApiKeys1769000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before adding
        const table = await queryRunner.getTable('api_keys');

        if (!table) {
            console.log('api_keys table does not exist, skipping migration');
            return;
        }

        // Add key_hash_short column if it doesn't exist
        if (!table.findColumnByName('key_hash_short')) {
            await queryRunner.addColumn(
                'api_keys',
                new TableColumn({
                    name: 'key_hash_short',
                    type: 'varchar',
                    length: '64',
                    isNullable: true,
                }),
            );
            console.log('Added key_hash_short column to api_keys');
        } else {
            console.log('key_hash_short column already exists');
        }

        // Create unique index on key_hash_short if it doesn't exist
        const existingIndexes = table.indices;
        const hasKeyHashShortIndex = existingIndexes.some(idx => idx.name === 'IDX_api_keys_key_hash_short');

        if (!hasKeyHashShortIndex) {
            await queryRunner.createIndex(
                'api_keys',
                new TableIndex({
                    name: 'IDX_api_keys_key_hash_short',
                    columnNames: ['key_hash_short'],
                    isUnique: true,
                }),
            );
            console.log('Created index IDX_api_keys_key_hash_short');
        } else {
            console.log('Index IDX_api_keys_key_hash_short already exists');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('api_keys');

        if (!table) {
            return;
        }

        // Drop index if exists
        const hasKeyHashShortIndex = table.indices.some(idx => idx.name === 'IDX_api_keys_key_hash_short');
        if (hasKeyHashShortIndex) {
            await queryRunner.dropIndex('api_keys', 'IDX_api_keys_key_hash_short');
        }

        // Drop column if exists
        if (table.findColumnByName('key_hash_short')) {
            await queryRunner.dropColumn('api_keys', 'key_hash_short');
        }
    }
}


