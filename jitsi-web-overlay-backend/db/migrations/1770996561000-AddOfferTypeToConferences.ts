import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOfferTypeToConferences1770996561000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ajout de  la colonne offer_type_at_creation à la table conferences
        const columnExists = await queryRunner.hasColumn('conferences', 'offer_type_at_creation');

        if (!columnExists) {
            const dbDriver = queryRunner.connection.driver.options.type;

            if (dbDriver === 'mariadb' || dbDriver === 'mysql') {
                // Pour MariaDB/MySQL, créer le type ENUM
                try {
                    await queryRunner.query(
                        `ALTER TABLE conferences ADD COLUMN offer_type_at_creation ENUM('basic', 'premium') NULL COMMENT "Type d'offre du client au moment de la création de la conférence"`,
                    );
                } catch (error) {
                    // En cas d'existance
                    console.error('Error adding offer_type_at_creation column:', error);
                }
            } else {

                await queryRunner.addColumn(
                    'conferences',
                    new TableColumn({
                        name: 'offer_type_at_creation',
                        type: 'enum',
                        enum: ['basic', 'premium'],
                        isNullable: true,
                        comment: 'Type d\'offre du client au moment de la création de la conférence',
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const columnExists = await queryRunner.hasColumn('conferences', 'offer_type_at_creation');

        if (columnExists) {
            await queryRunner.dropColumn('conferences', 'offer_type_at_creation');
        }
    }
}
