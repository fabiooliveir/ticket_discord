const { DataSource, Not } = require('typeorm');
const { Ticket } = require('../dist/database/entities/ticket.entity');

// Configuração do banco de dados
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'ticket_discord',
  entities: [Ticket],
  synchronize: false,
  logging: false,
});

async function checkDurationFields() {
  console.log('🔍 Verificando campos de SLA de duração na tabela tickets...\n');

  try {
    // Conectar ao banco
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    // Verificar estrutura da tabela
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    const columns = await queryRunner.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ticket_discord' 
      AND TABLE_NAME = 'tickets'
      AND COLUMN_NAME IN ('durationTimeMinutes', 'durationSlaStatus', 'closedAt')
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📊 Campos de SLA de duração encontrados:');
    if (columns.length === 0) {
      console.log('❌ Nenhum campo de duração encontrado!');
    } else {
      columns.forEach(col => {
        console.log(`   ✅ ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
        if (col.COLUMN_COMMENT) {
          console.log(`      Comentário: ${col.COLUMN_COMMENT}`);
        }
      });
    }

    // Verificar se há tickets com dados de duração
    const ticketRepository = dataSource.getRepository(Ticket);
    const ticketsWithDuration = await ticketRepository.count({
      where: { durationTimeMinutes: Not(null) }
    });

    const ticketsWithClosedAt = await ticketRepository.count({
      where: { closedAt: Not(null) }
    });

    console.log('\n📈 Estatísticas de tickets:');
    console.log(`   - Tickets com duração calculada: ${ticketsWithDuration}`);
    console.log(`   - Tickets com closedAt: ${ticketsWithClosedAt}`);

    // Testar criação de ticket com novos campos
    console.log('\n🧪 Testando criação de ticket com campos de duração...');
    const testTicket = ticketRepository.create({
      title: 'Teste Campos Duração',
      description: 'Teste para verificar campos de duração',
      status: 'open',
      priority: 'high',
      discordUserId: 'test-user',
      slaCategory: 'business_hours',
    });

    const savedTicket = await ticketRepository.save(testTicket);
    console.log(`✅ Ticket criado com ID: ${savedTicket.id}`);

    // Verificar se os campos existem no objeto
    console.log('\n🔍 Campos disponíveis no ticket:');
    const ticketFields = Object.keys(savedTicket);
    const durationFields = ticketFields.filter(field => 
      field.includes('duration') || field.includes('closedAt')
    );
    
    if (durationFields.length > 0) {
      console.log('✅ Campos de duração encontrados:');
      durationFields.forEach(field => {
        console.log(`   - ${field}: ${savedTicket[field]}`);
      });
    } else {
      console.log('❌ Campos de duração não encontrados no objeto!');
    }

    // Limpeza
    await ticketRepository.delete(savedTicket.id);
    console.log('\n🧹 Ticket de teste removido');

    await queryRunner.release();
    await dataSource.destroy();
    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkDurationFields()
    .then(() => {
      console.log('\n🎯 Verificação de campos de duração concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na verificação:', error);
      process.exit(1);
    });
}

module.exports = { checkDurationFields };
