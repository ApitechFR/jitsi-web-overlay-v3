import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddClientIdToExistingTables1770996553000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Liste des tables existantes (à partir de InitSchema migration)
    // Only include tables that are actually created in the database
    const tables = [
      'users',
      'conferences',
      'rooms',
      'participants',
      'replay',
      'feedback',
      'feedback_template',
      'whitelisted_domains',
      // NOTE: 'webinar_invitations' and 'stats' tables do not exist in InitSchema
      // They would need to be created by separate migrations before this one
    ];

    for (const table of tables) {
      try {
        // Check if table exists before trying to add column
        const tableExists = await queryRunner.hasTable(table);
        if (!tableExists) {
          console.log(`Table ${table} does not exist, skipping...`);
          continue;
        }

        // Verify the column doesn't already exist
        const columnExists = await queryRunner.hasColumn(table, 'client_id');
        if (!columnExists) {
          await queryRunner.addColumn(
            table,
            new TableColumn({
              name: 'client_id',
              type: 'varchar',
              length: '36',
              isNullable: true,
              comment: 'Client UID pour multi-tenant isolation (nullable pour compatibilité single-tenant)',
            }),
          );

          // Ajout de index pour ameliorer les requêtes filtrees par client
          const indexName = `IDX_${table}_client_id`;
          await queryRunner.query(
            `CREATE INDEX ${indexName} ON ${table} (client_id)`,
          );

          console.log(`Added client_id column and index to ${table}`);
        } else {
          console.log(`Column client_id already exists in ${table}, skipping...`);
        }
      } catch (error) {
        console.error(`Error processing table ${table}:`, error);
        throw error;
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'users',
      'conferences',
      'rooms',
      'participants',
      'replay',
      'feedback',
      'feedback_template',
      'whitelisted_domains',
    ];

    for (const table of tables) {
      try {
        const tableExists = await queryRunner.hasTable(table);
        if (!tableExists) {
          console.log(`Table ${table} does not exist, skipping...`);
          continue;
        }

        const columnExists = await queryRunner.hasColumn(table, 'client_id');
        if (columnExists) {
          const indexName = `IDX_${table}_client_id`;
          try {
            await queryRunner.query(`DROP INDEX ${indexName} ON ${table}`);
          } catch {
            // Index may not exist, continue
            console.log(`Index ${indexName} not found, continuing...`);
          }

          await queryRunner.dropColumn(table, 'client_id');
          console.log(`Dropped client_id column from ${table}`);
        }
      } catch (error) {
        console.error(`Error processing table ${table}:`, error);
        throw error;
      }
    }
  }
}
