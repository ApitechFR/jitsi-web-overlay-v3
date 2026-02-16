import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateClientsTable1770996551 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'clients',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'uid',
            type: 'varchar',
            length: '36',
            isUnique: true,
            comment: 'UUID v4 - public identifier',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'offer_type',
            type: 'varchar',
            length: '50',
            comment: 'BASIQUE or PREMIUM',
          },
          {
            name: 'offer_id',
            type: 'int',
          },
          {
            name: 'reseller_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Revendeur propriétaire - for multi-tenant isolation',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'deactivated_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime(6)',
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'datetime(6)',
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
      true,
    );

    // Indexes - Note: uid unique index is already created via column constraint
    await queryRunner.createIndex(
      'clients',
      new TableIndex({
        name: 'IDX_clients_reseller_active',
        columnNames: ['reseller_id', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'clients',
      new TableIndex({
        name: 'IDX_clients_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Foreign key to offers
    await queryRunner.createForeignKey(
      'clients',
      new TableForeignKey({
        name: 'FK_clients_offer_id',
        columnNames: ['offer_id'],
        referencedTableName: 'offers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('clients', 'FK_clients_offer_id');
    await queryRunner.dropTable('clients');
  }
}
