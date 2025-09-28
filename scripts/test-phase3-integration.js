const { DataSource } = require('typeorm');
const { Ticket } = require('../dist/database/entities/ticket.entity');
const { SlaService } = require('../dist/modules/sla/sla.service');
const { SlaConfig } = require('../dist/database/entities/sla-config.entity');
const { DashboardService } = require('../dist/modules/dashboard/dashboard.service');

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

async function testPhase3Integration() {
  console.log('🧪 Testando Fase 3: Integração - SLA de Duração...\n');

  try {
    // Conectar ao banco
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const ticketRepository = dataSource.getRepository(Ticket);
    const slaConfigRepository = dataSource.getRepository(SlaConfig);

    // Criar instâncias dos serviços
    const slaService = new SlaService(ticketRepository, slaConfigRepository);
    const dashboardService = new DashboardService(ticketRepository, slaConfigRepository, slaService);

    // 1. Teste: Criar tickets de teste
    console.log('📝 1. Criando tickets de teste...');
    
    const testTickets = [
      {
        title: 'Teste Crítico - Dentro do prazo',
        priority: 'critical',
        status: 'closed',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        slaCategory: 'business_hours',
      },
      {
        title: 'Teste Alta - Em risco',
        priority: 'high',
        status: 'closed',
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        slaCategory: 'business_hours',
      },
    ];

    const createdTickets = [];
    for (const ticketData of testTickets) {
      const ticket = ticketRepository.create({
        ...ticketData,
        discordUserId: 'test-user',
        discordChannelId: 'test-channel',
        assignedTo: 'test-agent',
        firstResponseAt: ticketData.status === 'closed' ? new Date(ticketData.createdAt.getTime() + 30 * 60 * 1000) : null,
        firstResponseCaptured: ticketData.status === 'closed',
        resolvedAt: ticketData.status === 'closed' ? new Date(ticketData.createdAt.getTime() + 60 * 60 * 1000) : null,
      });

      const savedTicket = await ticketRepository.save(ticket);
      createdTickets.push(savedTicket);
      console.log(`   ✅ Ticket criado: ${savedTicket.title}`);
    }

    // 2. Teste: Calcular SLA de duração
    console.log('\n📊 2. Calculando SLA de duração...');
    
    for (const ticket of createdTickets.filter(t => t.status === 'closed')) {
      const metrics = await slaService.calculateTicketSlaMetrics(ticket.id);
      console.log(`   ${ticket.title}: ${metrics.durationTimeMinutes}min - ${metrics.durationSlaStatus}`);
    }

    // 3. Teste: Dashboard Overview
    console.log('\n📊 3. Testando Dashboard Overview...');
    const dashboardOverview = await dashboardService.getDashboardOverview();
    
    console.log('   Dashboard Overview:');
    console.log(`     - Total Tickets: ${dashboardOverview.summary.totalTickets}`);
    console.log(`     - Duration SLA Compliance: ${dashboardOverview.summary.durationSla.durationComplianceRate}%`);

    // 4. Limpeza
    console.log('\n🧹 4. Limpando dados de teste...');
    for (const ticket of createdTickets) {
      await ticketRepository.delete(ticket.id);
    }
    console.log('   ✅ Dados de teste removidos');

    console.log('\n🎉 Fase 3 testada com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante teste da Fase 3:', error.message);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n✅ Conexão com banco fechada');
    }
  }
}

if (require.main === module) {
  testPhase3Integration()
    .then(() => {
      console.log('\n🎯 Fase 3: Integração - CONCLUÍDA!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha no teste da Fase 3:', error);
      process.exit(1);
    });
}

module.exports = { testPhase3Integration };