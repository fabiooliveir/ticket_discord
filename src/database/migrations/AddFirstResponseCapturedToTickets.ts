import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFirstResponseCapturedToTickets1700000000001
  implements MigrationInterface
{
  name = 'AddFirstResponseCapturedToTickets1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tickets');

    if (!table) {
      throw new Error('Tabela tickets não encontrada');
    }

    // Verificar se a coluna já existe
    const columnExists = table.findColumnByName('firstResponseCaptured');

    if (!columnExists) {
      await queryRunner.addColumn(
        'tickets',
        new TableColumn({
          name: 'firstResponseCaptured',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );

      console.log(
        '✅ Coluna firstResponseCaptured adicionada à tabela tickets',
      );
    } else {
      console.log(
        '⚠️ Coluna firstResponseCaptured já existe na tabela tickets',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tickets', 'firstResponseCaptured');
    console.log('✅ Coluna firstResponseCaptured removida da tabela tickets');
  }
}
