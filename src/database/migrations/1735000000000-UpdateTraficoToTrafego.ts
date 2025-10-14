import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTraficoToTrafego1735000000000
  implements MigrationInterface
{
  name = 'UpdateTraficoToTrafego1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Atualizar todos os registros de tickets que têm team='trafico' no categoryData
    await queryRunner.query(`
      UPDATE tickets 
      SET categoryData = JSON_SET(categoryData, '$.team', 'trafego')
      WHERE JSON_EXTRACT(categoryData, '$.team') = 'trafico'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter a mudança em caso de rollback
    await queryRunner.query(`
      UPDATE tickets 
      SET categoryData = JSON_SET(categoryData, '$.team', 'trafico')
      WHERE JSON_EXTRACT(categoryData, '$.team') = 'trafego'
    `);
  }
}






