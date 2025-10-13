import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhoneToUser1700000000006 implements MigrationInterface {
  name = 'AddPhoneToUser1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'phone');
  }
}











