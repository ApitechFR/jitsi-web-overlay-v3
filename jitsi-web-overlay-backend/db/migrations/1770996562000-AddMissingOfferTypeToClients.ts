import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Ajouter la colonne offer_type manquante à la table clients
 * 
 * Cette migration corrige le problème que la migration 1770996551000-CreateClientsTable  
 * n'a pas été exécutée en production, la colonne offer_type manque.
 * 
 * Changement dans le schéma:
 * - TypeORM utilise désormais VARCHAR(50) pour offer_type (au lieu d'ENUM)
 * - C'est plus flexible et évite les problèmes de migration TypeORM
 * - Les valeurs valides restent: 'basic', 'premium'
 * 
 * Cette migration est idempotente et sûre même si la colonne existe déjà.
 */
export class AddMissingOfferTypeToClients1770996562000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // Vérifier si la colonne existe
            const table = await queryRunner.getTable('clients');
            const hasOfferTypeColumn = table?.columns.some(col => col.name === 'offer_type');

            if (!hasOfferTypeColumn) {
                console.log('[Migration] Adding missing offer_type column to clients table...');

                // Ajouter la colonne offer_type en tant que VARCHAR (pas ENUM)
                // C'est plus flexible et évite les problèmes TypeORM avec MySQL ENUM
                await queryRunner.addColumn(
                    'clients',
                    new TableColumn({
                        name: 'offer_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                        comment: 'Offer type for the client: basic or premium',
                    }),
                );

                // Mettre à jour les valeurs NULL par défaut
                await queryRunner.query(
                    "UPDATE `clients` SET `offer_type` = 'basic' WHERE `offer_type` IS NULL",
                );

                // Rendre la colonne NOT NULL
                await queryRunner.changeColumn(
                    'clients',
                    'offer_type',
                    new TableColumn({
                        name: 'offer_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                        comment: 'Offer type for the client: basic or premium',
                    }),
                );

                console.log('[Migration] ✓ offer_type column added successfully');
            } else {
                console.log('[Migration] ✓ offer_type column already exists');
            }
        } catch (error) {
            console.error('[Migration] ✗ Error in up():', error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            const table = await queryRunner.getTable('clients');
            const hasOfferTypeColumn = table?.columns.some(col => col.name === 'offer_type');

            if (hasOfferTypeColumn) {
                await queryRunner.dropColumn('clients', 'offer_type');
                console.log('[Migration] ✓ offer_type column removed');
            }
        } catch (error) {
            console.error('[Migration] ✗ Error in down():', error);
            throw error;
        }
    }
}
