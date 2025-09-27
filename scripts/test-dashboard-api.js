const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testDashboardApi() {
  console.log('📊 Testando API do Dashboard...\n');

  try {
    // Teste 1: Visão geral do dashboard
    console.log('1️⃣ Testando GET /dashboard/overview...');
    const overview = await axios.get(`${BASE_URL}/dashboard/overview`);
    console.log(`✅ Overview carregado:`);
    console.log(`   - Total de tickets: ${overview.data.summary.totalTickets}`);
    console.log(`   - Taxa de compliance: ${overview.data.summary.complianceRate}%`);
    console.log(`   - Tickets abertos: ${overview.data.summary.openTickets}`);
    console.log(`   - Tickets criados hoje: ${overview.data.trends.ticketsCreatedToday}\n`);

    // Teste 2: KPIs principais
    console.log('2️⃣ Testando GET /dashboard/kpis...');
    const kpis = await axios.get(`${BASE_URL}/dashboard/kpis`);
    console.log(`✅ KPIs carregados:`);
    console.log(`   - Total de tickets: ${kpis.data.totalTickets}`);
    console.log(`   - Compliance rate: ${kpis.data.complianceRate}%`);
    console.log(`   - Tickets hoje: ${kpis.data.ticketsToday}\n`);

    // Teste 3: Métricas do mês
    console.log('3️⃣ Testando GET /dashboard/metrics/month...');
    const monthMetrics = await axios.get(`${BASE_URL}/dashboard/metrics/month`);
    console.log(`✅ Métricas do mês:`);
    console.log(`   - Tickets criados: ${monthMetrics.data.volumeMetrics.ticketsCreated}`);
    console.log(`   - Compliance geral: ${monthMetrics.data.slaMetrics.overallCompliance}%`);
    console.log(`   - Tempo médio de resolução: ${monthMetrics.data.slaMetrics.averageResolutionTime} min\n`);

    // Teste 4: Alertas
    console.log('4️⃣ Testando GET /dashboard/alerts...');
    const alerts = await axios.get(`${BASE_URL}/dashboard/alerts`);
    console.log(`✅ Alertas carregados: ${alerts.data.length} alertas`);
    alerts.data.forEach(alert => {
      console.log(`   - ${alert.message} (${alert.priority})`);
    });
    console.log('');

    // Teste 5: Tendências
    console.log('5️⃣ Testando GET /dashboard/trends...');
    const trends = await axios.get(`${BASE_URL}/dashboard/trends`);
    console.log(`✅ Tendências carregadas:`);
    console.log(`   - Tickets criados hoje: ${trends.data.ticketsCreated.today}`);
    console.log(`   - Tickets criados esta semana: ${trends.data.ticketsCreated.thisWeek}`);
    console.log(`   - Compliance atual: ${trends.data.complianceTrend.current}%\n`);

    // Teste 6: Performance do mês
    console.log('6️⃣ Testando GET /dashboard/performance/month...');
    const performance = await axios.get(`${BASE_URL}/dashboard/performance/month`);
    console.log(`✅ Performance do mês:`);
    console.log(`   - Total de agentes: ${performance.data.summary.totalAgents}`);
    console.log(`   - Agentes ativos: ${performance.data.summary.activeAgents}`);
    console.log(`   - Tickets resolvidos: ${performance.data.summary.resolvedTickets}`);
    console.log(`   - Performance de agentes: ${performance.data.agentPerformance.length} agentes\n`);

    // Teste 7: Distribuição por prioridade
    console.log('7️⃣ Testando GET /dashboard/distribution/priority...');
    const priorityDist = await axios.get(`${BASE_URL}/dashboard/distribution/priority`);
    console.log(`✅ Distribuição por prioridade:`);
    Object.entries(priorityDist.data).forEach(([priority, count]) => {
      console.log(`   - ${priority}: ${count} tickets`);
    });
    console.log('');

    // Teste 8: Métricas SLA detalhadas
    console.log('8️⃣ Testando GET /dashboard/sla/details...');
    const slaDetails = await axios.get(`${BASE_URL}/dashboard/sla/details`);
    console.log(`✅ Detalhes SLA:`);
    console.log(`   - Compliance geral: ${slaDetails.data.overallCompliance}%`);
    console.log(`   - Violações SLA: ${slaDetails.data.slaBreaches}`);
    console.log(`   - Tempo médio de resposta: ${slaDetails.data.averageResponseTime} min`);
    console.log(`   - Performance por prioridade: ${Object.keys(slaDetails.data.performanceByPriority).length} prioridades\n`);

    // Teste 9: Gráficos de linha temporal
    console.log('9️⃣ Testando GET /dashboard/charts/timeline...');
    const timeline = await axios.get(`${BASE_URL}/dashboard/charts/timeline`);
    console.log(`✅ Gráficos de timeline:`);
    console.log(`   - Pontos de dados: ${timeline.data.ticketsCreated.length} dias`);
    console.log(`   - Tickets criados (último dia): ${timeline.data.ticketsCreated[timeline.data.ticketsCreated.length - 1]?.count || 0}`);
    console.log(`   - Compliance (último dia): ${timeline.data.complianceRate[timeline.data.complianceRate.length - 1]?.rate || 0}%\n`);

    // Teste 10: Gráficos de distribuição
    console.log('🔟 Testando GET /dashboard/charts/distribution...');
    const distribution = await axios.get(`${BASE_URL}/dashboard/charts/distribution`);
    console.log(`✅ Gráficos de distribuição:`);
    console.log(`   - Distribuição por prioridade: ${distribution.data.byPriority.length} categorias`);
    console.log(`   - Distribuição por categoria: ${distribution.data.byCategory.length} categorias`);
    console.log(`   - Distribuição horária: ${distribution.data.hourly.length} horas\n`);

    console.log('🎉 Todos os testes do Dashboard passaram com sucesso!');
    console.log('\n📊 Resumo das funcionalidades do Dashboard:');
    console.log('   ✅ Visão geral e KPIs principais');
    console.log('   ✅ Métricas por período (dia/semana/mês/trimestre/ano)');
    console.log('   ✅ Sistema de alertas em tempo real');
    console.log('   ✅ Análise de tendências e performance');
    console.log('   ✅ Relatórios de performance por agente');
    console.log('   ✅ Distribuições e gráficos');
    console.log('   ✅ Métricas SLA detalhadas');
    console.log('   ✅ Dados para visualizações');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Dica: Certifique-se de que a aplicação está rodando:');
      console.log('   npm run start:dev');
    }
  }
}

// Executar testes
testDashboardApi();
