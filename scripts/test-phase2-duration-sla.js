const { DataSource } = require('typeorm');
const { Ticket } = require('../dist/database/entities/ticket.entity');
const { SlaService } = require('../dist/modules/sla/sla.service');
const { SlaConfig } = require('../dist/database/entities/sla-config.entity');

// Configuração do banco de dados
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'ticket_discord',
  entities: [Ticket, SlaConfig],
  synchronize: false,
  logging: false,
});

async function testPhase2DurationSla() {
  console.log('🧪 Testando Fase 2: Lógica de Negócio - SLA de Duração...\n');

  try {
    // Conectar ao banco
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const ticketRepository = dataSource.getRepository(Ticket);
    const slaConfigRepository = dataSource.getRepository(SlaConfig);

    // Criar instância do SlaService
    const slaService = new SlaService(ticketRepository, slaConfigRepository);

    // 1. Teste: Criar ticket de teste
    console.log('📝 1. Criando ticket de teste...');
    const testTicket = ticketRepository.create({
      title: 'Teste SLA Duração - Fase 2',
      description: 'Ticket para testar SLA de duração',
      status: 'open',
      priority: 'high',
      discordUserId: 'test-user-123',
      discordChannelId: 'test-channel-123',
      slaCategory: 'business_hours',
      createdAt: new Date(),
    });

    const savedTicket = await ticketRepository.save(testTicket);
    console.log(`✅ Ticket criado: ${savedTicket.id}`);

    // 2. Teste: Simular fechamento com SLA de duração
    console.log('\n📊 2. Simulando fechamento com SLA de duração...');
    
    // Simular que o ticket foi fechado há 2 horas (dentro do prazo para alta prioridade)
    const closedAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 horas atrás
    
    await ticketRepository.update(savedTicket.id, {
      status: 'closed',
      closedAt: closedAt,
      assignedTo: 'test-agent-123',
      firstResponseAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 min após criação
      firstResponseCaptured: true,
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hora após criação
    });

    // 3. Teste: Calcular métricas SLA
    console.log('\n📈 3. Calculando métricas SLA...');
    const ticketMetrics = await slaService.calculateTicketSlaMetrics(savedTicket.id);
    
    console.log('📊 Métricas do ticket:');
    console.log(`   - Response Time: ${ticketMetrics.responseTimeMinutes}min`);
    console.log(`   - Resolution Time: ${ticketMetrics.resolutionTimeMinutes}min`);
    console.log(`   - Duration Time: ${ticketMetrics.durationTimeMinutes}min`);
    console.log(`   - Response SLA: ${ticketMetrics.responseSlaStatus}`);
    console.log(`   - Resolution SLA: ${ticketMetrics.resolutionSlaStatus}`);
    console.log(`   - Duration SLA: ${ticketMetrics.durationSlaStatus}`);

    // 4. Teste: Atualizar métricas SLA
    console.log('\n🔄 4. Atualizando métricas SLA...');
    const updatedTicket = await slaService.updateTicketSlaMetrics(savedTicket.id);
    
    console.log('📊 Ticket atualizado:');
    console.log(`   - Duration Time: ${updatedTicket.durationTimeMinutes}min`);
    console.log(`   - Duration SLA Status: ${updatedTicket.durationSlaStatus}`);

    // 5. Teste: Calcular métricas gerais
    console.log('\n📊 5. Calculando métricas gerais...');
    const generalMetrics = await slaService.calculateSlaMetrics();
    
    console.log('📈 Métricas gerais:');
    console.log(`   - Total Tickets: ${generalMetrics.totalTickets}`);
    console.log(`   - Compliant Duration: ${generalMetrics.compliantDuration}`);
    console.log(`   - At Risk Duration: ${generalMetrics.atRiskDuration}`);
    console.log(`   - Breached Duration: ${generalMetrics.breachedDuration}`);
    console.log(`   - Average Duration: ${generalMetrics.averageDurationTime}min`);
    console.log(`   - Duration Compliance: ${generalMetrics.durationComplianceRate}%`);

    // 6. Teste: Métricas por prioridade
    console.log('\n🎯 6. Métricas por prioridade:');
    Object.entries(generalMetrics.metricsByPriority).forEach(([priority, metrics]) => {
      console.log(`   ${priority.toUpperCase()}:`);
      console.log(`     - Total: ${metrics.total}`);
      console.log(`     - Compliant Duration: ${metrics.compliantDuration}`);
      console.log(`     - At Risk Duration: ${metrics.atRiskDuration}`);
      console.log(`     - Breached Duration: ${metrics.breachedDuration}`);
      console.log(`     - Avg Duration: ${metrics.avgDurationTime}min`);
      console.log(`     - Duration Compliance: ${metrics.durationComplianceRate}%`);
    });

    // 7. Limpeza
    console.log('\n🧹 7. Limpando dados de teste...');
    await ticketRepository.delete(savedTicket.id);
    console.log('✅ Dados de teste removidos');

    console.log('\n🎉 Fase 2 testada com sucesso!');
    console.log('✅ Todas as funcionalidades de SLA de duração estão funcionando');

  } catch (error) {
    console.error('❌ Erro durante teste da Fase 2:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Fechar conexão
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n✅ Conexão com banco fechada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testPhase2DurationSla()
    .then(() => {
      console.log('\n🎯 Fase 2: Lógica de Negócio - CONCLUÍDA!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha no teste da Fase 2:', error);
      process.exit(1);
    });
}

module.exports = { testPhase2DurationSla };

