import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSlaConfigsTable1700000000002 implements MigrationInterface {
  name = 'CreateSlaConfigsTable1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se a tabela já existe
    const tableExists = await queryRunner.hasTable('sla_configs');
    if (tableExists) {
      console.log('Tabela sla_configs já existe, pulando criação...');
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'sla_configs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'responseTimeTarget',
            type: 'int',
          },
          {
            name: 'resolutionTimeTarget',
            type: 'int',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_SLA_CONFIGS_CATEGORY',
            columnNames: ['category'],
          },
          {
            name: 'IDX_SLA_CONFIGS_PRIORITY',
            columnNames: ['priority'],
          },
          {
            name: 'IDX_SLA_CONFIGS_ACTIVE',
            columnNames: ['isActive'],
          },
        ],
      }),
      true,
    );

    // Inserir configurações padrão de SLA
    await queryRunner.query(`
      INSERT INTO sla_configs (name, category, priority, responseTimeTarget, resolutionTimeTarget, description) VALUES
      ('Crítico - Business Hours', 'business_hours', 'critical', 15, 120, 'SLA para tickets críticos em horário comercial'),
      ('Alta Prioridade - Business Hours', 'business_hours', 'high', 30, 240, 'SLA para tickets de alta prioridade em horário comercial'),
      ('Média Prioridade - Business Hours', 'business_hours', 'medium', 120, 1440, 'SLA para tickets de média prioridade em horário comercial'),
      ('Baixa Prioridade - Business Hours', 'business_hours', 'low', 480, 4320, 'SLA para tickets de baixa prioridade em horário comercial'),
      ('Crítico - After Hours', 'after_hours', 'critical', 60, 480, 'SLA para tickets críticos fora do horário comercial'),
      ('Alta Prioridade - After Hours', 'after_hours', 'high', 240, 960, 'SLA para tickets de alta prioridade fora do horário comercial'),
      ('Média Prioridade - After Hours', 'after_hours', 'medium', 480, 2880, 'SLA para tickets de média prioridade fora do horário comercial'),
      ('Baixa Prioridade - After Hours', 'after_hours', 'low', 1440, 8640, 'SLA para tickets de baixa prioridade fora do horário comercial');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sla_configs');
  }
}
