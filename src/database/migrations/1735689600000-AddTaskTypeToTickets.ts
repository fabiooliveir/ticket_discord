import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTaskTypeToTickets1735689600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'tickets',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enum: ['leadfy', 'c7_auto'],
        default: "'leadfy'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tickets', 'type');
  }
}
