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

    // Get the IDs of the inserted/existing feedback types
    const ratingType = await queryRunner.query(
      `SELECT id FROM feedback_type WHERE name = 'rating' LIMIT 1`
    );
    const textType = await queryRunner.query(
      `SELECT id FROM feedback_type WHERE name = 'text' LIMIT 1`
    );

    if (ratingType.length > 0 && textType.length > 0) {
      const ratingTypeId = ratingType[0].id;
      const textTypeId = textType[0].id;

      // Insert templates with the correct typeIds
      await queryRunner.query(`
                INSERT INTO feedback_template (label, typeId, organization)
                VALUES
                    ('Qu''avez-vous pensé de la qualité de l''appel ?', ${ratingTypeId}, 'apitech'),
                    ('Laissez un commentaire', ${textTypeId}, 'apitech')
                ON DUPLICATE KEY UPDATE 
                    label = VALUES(label),
                    organization = VALUES(organization);
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove templates for apitech organization only
    await queryRunner.query(`
      DELETE FROM feedback_template
      WHERE label IN (
        'Qu''avez-vous pensé de la qualité de l''appel ?',
        'Laissez un commentaire'
      )
      AND organization = 'apitech';
    `);

    // Remove feedback types only if they are not used by other templates
    await queryRunner.query(`
      DELETE FROM feedback_type
      WHERE name IN ('rating', 'text')
      AND id NOT IN (SELECT DISTINCT typeId FROM feedback_template WHERE typeId IS NOT NULL);
    `);
  }

}
