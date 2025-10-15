import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMessagesColumn1760537696000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'tickets',
      new TableColumn({
        name: 'messages',
        type: 'json',
        isNullable: true,
        comment: 'Histórico de mensagens do ticket capturadas ao arquivar',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tickets', 'messages');
  }
}
