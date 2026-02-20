import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddKeyHashShortToApiKeys1769000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // Ajouter la colonne key_hash_short (nullable initially)
            await queryRunner.addColumn(
                'api_keys',
                new TableColumn({
                    name: 'key_hash_short',
                    type: 'varchar',
                    length: '64',
                    isNullable: true,
                }),
            );
        } catch (error) {
            // Column might already exist, continue
            if (error instanceof Error && error.message.includes('already exists')) {
                console.log('key_hash_short already exists or migration already applied');
            } else {
                throw error;
            }
        }

        try {
            // Créer un index unique sur key_hash_short
            await queryRunner.createIndex(
                'api_keys',
                new TableIndex({
                    name: 'IDX_api_keys_key_hash_short',
                    columnNames: ['key_hash_short'],
                    isUnique: true,
                }),
            );
        } catch (error) {
            // Index might already exist, continue
            if (error instanceof Error && error.message.includes('already exists')) {
                console.log('Index IDX_api_keys_key_hash_short already exists');
            } else {
                throw error;
            }
        }

        try {
            // Ajouter un index sur last_used_at si n'existe pas
            await queryRunner.createIndex(
                'api_keys',
                new TableIndex({
                    name: 'IDX_api_keys_last_used',
                    columnNames: ['last_used_at'],
                }),
            );
        } catch (error) {
            // Index might already exist, continue
            if (error instanceof Error && error.message.includes('already exists')) {
                console.log('Index IDX_api_keys_last_used already exists');
            } else {
                throw error;
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.dropIndex('api_keys', 'IDX_api_keys_last_used');
        } catch (error) {
            if (error instanceof Error && error.message.includes('does not exist')) {
                console.log('Index not found');
            } else {
                throw error;
            }
        }

        try {
            await queryRunner.dropIndex('api_keys', 'IDX_api_keys_key_hash_short');
        } catch (error) {
            if (error instanceof Error && error.message.includes('does not exist')) {
                console.log('Index not found');
            } else {
                throw error;
            }
        }

        try {
            await queryRunner.dropColumn('api_keys', 'key_hash_short');
        } catch (error) {
            if (error instanceof Error && error.message.includes('does not exist')) {
                console.log('Column not found');
            } else {
                throw error;
            }
        }
    }
}


