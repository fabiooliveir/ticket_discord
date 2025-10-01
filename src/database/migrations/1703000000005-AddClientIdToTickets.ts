import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientIdToTickets1703000000005 implements MigrationInterface {
  name = 'AddClientIdToTickets1703000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `tickets` ADD `clientId` varchar(100) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `tickets` DROP COLUMN `clientId`');
  }
}
