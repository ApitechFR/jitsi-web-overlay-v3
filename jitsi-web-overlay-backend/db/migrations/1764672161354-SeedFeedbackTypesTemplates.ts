import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedFeedbackTypesTemplates1764672161354 implements MigrationInterface {
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert feedback types
        await queryRunner.query(`
      INSERT INTO feedback_type (name, description)
      VALUES 
        ('rating', 'satisfaction'),
        ('text', 'commentaire')
      ON DUPLICATE KEY UPDATE 
        description = VALUES(description);
    `);

        // Insert templates
        await queryRunner.query(`
      INSERT INTO feedback_template (label, typeId, organization)
      VALUES
        ('Qu''avez-vous pensé de la qualité de l''appel ?', 1, 'apitech'),
        ('Laissez un commentaire', 2, 'apitech')
      ON DUPLICATE KEY UPDATE 
        label = VALUES(label),
        organization = VALUES(organization);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove templates
        await queryRunner.query(`
      DELETE FROM feedback_template
      WHERE label IN (
        'Qu''avez-vous pensé de la qualité de l''appel ?',
        'Laissez un commentaire'
      );
    `);

        // Remove types
        await queryRunner.query(`
      DELETE FROM feedback_type
      WHERE name IN ('rating', 'text');
    `);
    }

}
