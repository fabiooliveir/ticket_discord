import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTicketCategoryFields1703000000000
  implements MigrationInterface
{
  name = 'AddTicketCategoryFields1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('tickets', [
      new TableColumn({
        name: 'categoryId',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'website',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
      new TableColumn({
        name: 'categoryData',
        type: 'json',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('tickets', [
      'categoryId',
      'website',
      'categoryData',
    ]);
  }
}
