import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateClientRelatedTables1770996552 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ClientCustomization
    await queryRunner.createTable(
      new Table({
        name: 'client_customizations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'client_id',
            type: 'int',
            isUnique: true,
          },
          {
            name: 'logo',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'logo_small',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'logo_dark_mode',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'favicon',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'app_name',
            type: 'varchar',
            length: '50',
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

    await queryRunner.createForeignKey(
      'client_customizations',
      new TableForeignKey({
        name: 'FK_client_customizations_client_id',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // ClientModule
    await queryRunner.createTable(
      new Table({
        name: 'client_modules',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'client_id',
            type: 'int',
          },
          {
            name: 'module_key',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'config',
            type: 'json',
            isNullable: true,
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

    await queryRunner.createIndex(
      'client_modules',
      new TableIndex({
        name: 'IDX_client_modules_client_enabled',
        columnNames: ['client_id', 'enabled'],
      }),
    );

    await queryRunner.createIndex(
      'client_modules',
      new TableIndex({
        name: 'UQ_client_modules_client_module',
        columnNames: ['client_id', 'module_key'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'client_modules',
      new TableForeignKey({
        name: 'FK_client_modules_client_id',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // ClientAuthConfig
    await queryRunner.createTable(
      new Table({
        name: 'client_auth_configs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'client_id',
            type: 'int',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            comment: 'oidc, ldap, local',
          },
          {
            name: 'config',
            type: 'json',
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

    await queryRunner.createForeignKey(
      'client_auth_configs',
      new TableForeignKey({
        name: 'FK_client_auth_configs_client_id',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // ClientDomain
    await queryRunner.createTable(
      new Table({
        name: 'client_domains',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'client_id',
            type: 'int',
          },
          {
            name: 'domain_name',
            type: 'varchar',
            length: '255',
            isUnique: true,
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

    await queryRunner.createIndex(
      'client_domains',
      new TableIndex({
        name: 'IDX_client_domains_client_id',
        columnNames: ['client_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'client_domains',
      new TableForeignKey({
        name: 'FK_client_domains_client_id',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // ApiKey
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
            name: 'key_hash',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'reseller_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'revoked_at',
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

    // Note: key_hash unique index is already created via column constraint
    await queryRunner.createIndex(
      'api_keys',
      new TableIndex({
        name: 'IDX_api_keys_reseller_active',
        columnNames: ['reseller_id', 'is_active'],
      }),
    );

    // ClientOfferChangeHistory
    await queryRunner.createTable(
      new Table({
        name: 'client_offer_changes_history',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'client_id',
            type: 'int',
          },
          {
            name: 'from_offer',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'to_offer',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'effective_date',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'applied_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
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

    await queryRunner.createIndex(
      'client_offer_changes_history',
      new TableIndex({
        name: 'IDX_client_offer_changes_client_status',
        columnNames: ['client_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'client_offer_changes_history',
      new TableIndex({
        name: 'IDX_client_offer_changes_effective_date',
        columnNames: ['effective_date'],
      }),
    );

    await queryRunner.createForeignKey(
      'client_offer_changes_history',
      new TableForeignKey({
        name: 'FK_client_offer_changes_client_id',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('client_offer_changes_history');
    await queryRunner.dropTable('api_keys');
    await queryRunner.dropTable('client_domains');
    await queryRunner.dropTable('client_auth_configs');
    await queryRunner.dropTable('client_modules');
    await queryRunner.dropTable('client_customizations');
  }
}
