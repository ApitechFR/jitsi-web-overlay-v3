import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddClientIdToExistingTables1770996553000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Liste des tables existantes
    const tables = [
      'users',
      'conferences',
      'rooms',
      'participants',
      'replay',
      'feedback',
      'feedback_template',
      'webinar_invitations',
      'whitelisted_domains',
      'stats',
    ];

    for (const table of tables) {
      // Verifier la colonne n'existe pas deja
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

        // Ajout de  index pour ameliorer les requêtes filtrees par client
        const indexName = `IDX_${table}_client_id`;
        await queryRunner.query(
          `CREATE INDEX ${indexName} ON ${table} (client_id)`,
        );
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
      'webinar_invitations',
      'whitelisted_domains',
      'stats',
    ];

    for (const table of tables) {
      const columnExists = await queryRunner.hasColumn(table, 'client_id');
      if (columnExists) {
        const indexName = `IDX_${table}_client_id`;
        try {
          await queryRunner.query(`DROP INDEX ${indexName} ON ${table}`);
        } catch {
          // Index may not exist, continue
        }

        await queryRunner.dropColumn(table, 'client_id');
      }
    }
  }
}
