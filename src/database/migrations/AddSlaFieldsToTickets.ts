import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSlaFieldsToTickets1700000000001 implements MigrationInterface {
  name = 'AddSlaFieldsToTickets1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tickets');
    if (!table) {
      throw new Error('Tabela tickets não encontrada');
    }

    const columnsToAdd: TableColumn[] = [];

    // Verificar se cada coluna já existe antes de adicionar
    if (!table.findColumnByName('firstResponseAt')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'firstResponseAt',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    if (!table.findColumnByName('resolvedAt')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'resolvedAt',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    if (!table.findColumnByName('closedAt')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'closedAt',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    if (!table.findColumnByName('responseTimeMinutes')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'responseTimeMinutes',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    if (!table.findColumnByName('resolutionTimeMinutes')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'resolutionTimeMinutes',
          type: 'int',
          isNullable: true,
        }),
      );
    }

    if (!table.findColumnByName('slaCategory')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'slaCategory',
          type: 'varchar',
          length: '50',
          default: "'business_hours'",
        }),
      );
    }

    // Adicionar apenas as colunas que não existem
    if (columnsToAdd.length > 0) {
      await queryRunner.addColumns('tickets', columnsToAdd);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('tickets', [
      'firstResponseAt',
      'resolvedAt',
      'closedAt',
      'responseTimeMinutes',
      'resolutionTimeMinutes',
      'slaCategory',
    ]);
  }
}
