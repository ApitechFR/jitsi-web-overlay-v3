import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOffersTable1770996550 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'offers',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isUnique: true,
            comment: 'BASIC or PREMIUM',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'modules',
            type: 'json',
            comment: 'Array of ModuleKeys included in this offer',
          },
          {
            name: 'limits',
            type: 'json',
            isNullable: true,
            comment: 'maxParticipants, replayRetentionDays, etc.',
          },
          {
            name: 'customization_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'datetime(6)',
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
      true,
    );
    // Note: Index unique on 'type' is created automatically via column constraint isUnique: true
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('offers');
  }
}
