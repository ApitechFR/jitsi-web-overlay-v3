import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seed data migration for offers table
 * Creates BASIQUE and PREMIUM offers with their modules and limits
 */
export class SeedOffersTable1770996560 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // BASIQUE offer
        await queryRunner.query(`
      INSERT INTO offers (type, name, description, modules, limits, customization_enabled, created_at)
      VALUES (
        'basique',
        'Offre Basique',
        'Modules essentiels: visio et feedback',
        '["visio_jitsi", "feedback"]',
        '{"maxParticipants": 100, "replayRetentionDays": 0}',
        false,
        NOW()
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        modules = VALUES(modules),
        limits = VALUES(limits),
        customization_enabled = VALUES(customization_enabled)
    `);

        // PREMIUM offer
        await queryRunner.query(`
      INSERT INTO offers (type, name, description, modules, limits, customization_enabled, created_at)
      VALUES (
        'premium',
        'Offre Premium',
        'Tous les modules: visio, feedback, webinaire, replay, recording, whiteboard',
        '["visio_jitsi", "feedback", "webinar", "replay", "recording", "whiteboard"]',
        '{"maxParticipants": 500, "replayRetentionDays": 365}',
        true,
        NOW()
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        modules = VALUES(modules),
        limits = VALUES(limits),
        customization_enabled = VALUES(customization_enabled)
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete the seeded offers
        await queryRunner.query("DELETE FROM offers WHERE type IN ('basique', 'premium')");
    }
}
