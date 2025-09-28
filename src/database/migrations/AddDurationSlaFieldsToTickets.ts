import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDurationSlaFieldsToTickets1700000000001
  implements MigrationInterface
{
  name = 'AddDurationSlaFieldsToTickets1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tickets');
    if (!table) {
      throw new Error('Tabela tickets não encontrada');
    }

    const columnsToAdd: TableColumn[] = [];

    // Verificar se as colunas já existem antes de adicionar
    if (!table.findColumnByName('durationTimeMinutes')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'durationTimeMinutes',
          type: 'int',
          isNullable: true,
          comment:
            'Tempo total de duração do atendimento em minutos (criação até arquivamento)',
        }),
      );
    }

    if (!table.findColumnByName('durationSlaStatus')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'durationSlaStatus',
          type: 'varchar',
          length: '50',
          isNullable: true,
          comment:
            'Status do SLA de duração (compliant, at_risk, breached, not_applicable)',
        }),
      );
    }

    // Adicionar colunas se houver alguma para adicionar
    if (columnsToAdd.length > 0) {
      await queryRunner.addColumns('tickets', columnsToAdd);
      console.log(
        `✅ Adicionadas ${columnsToAdd.length} colunas de SLA de duração na tabela tickets`,
      );
    } else {
      console.log(
        'ℹ️ Todas as colunas de SLA de duração já existem na tabela tickets',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tickets');
    if (!table) {
      throw new Error('Tabela tickets não encontrada');
    }

    const columnsToRemove: string[] = [];

    // Verificar se as colunas existem antes de remover
    if (table.findColumnByName('durationTimeMinutes')) {
      columnsToRemove.push('durationTimeMinutes');
    }

    if (table.findColumnByName('durationSlaStatus')) {
      columnsToRemove.push('durationSlaStatus');
    }

    // Remover colunas se houver alguma para remover
    if (columnsToRemove.length > 0) {
      await queryRunner.dropColumns('tickets', columnsToRemove);
      console.log(
        `✅ Removidas ${columnsToRemove.length} colunas de SLA de duração da tabela tickets`,
      );
    } else {
      console.log(
        'ℹ️ Nenhuma coluna de SLA de duração encontrada para remover',
      );
    }
  }
}

