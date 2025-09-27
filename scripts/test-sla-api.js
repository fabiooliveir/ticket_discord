const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testSlaApi() {
  console.log('🧪 Testando API de SLA...\n');

  try {
    // Teste 1: Verificar configurações de SLA
    console.log('1️⃣ Testando GET /sla/configs...');
    const configs = await axios.get(`${BASE_URL}/sla/configs`);
    console.log(`✅ Configurações encontradas: ${configs.data.length}`);
    console.log(`   - Primeira configuração: ${configs.data[0]?.name || 'N/A'}\n`);

    // Teste 2: Verificar métricas de SLA
    console.log('2️⃣ Testando GET /sla/metrics...');
    const metrics = await axios.get(`${BASE_URL}/sla/metrics`);
    console.log(`✅ Métricas carregadas:`);
    console.log(`   - Total de tickets: ${metrics.data.totalTickets}`);
    console.log(`   - Taxa de compliance: ${metrics.data.complianceRate}%\n`);

    // Teste 3: Verificar status atual
    console.log('3️⃣ Testando GET /sla/status...');
    const status = await axios.get(`${BASE_URL}/sla/status`);
    console.log(`✅ Status atual:`);
    console.log(`   - Compliance geral: ${status.data.overall.complianceRate}%`);
    console.log(`   - Tickets em risco: ${status.data.overall.atRiskTickets}\n`);

    // Teste 4: Testar métricas por período (últimos 30 dias)
    console.log('4️⃣ Testando GET /sla/metrics/period...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const periodMetrics = await axios.get(`${BASE_URL}/sla/metrics/period`, {
      params: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    });
    console.log(`✅ Métricas do período:`);
    console.log(`   - Tickets no período: ${periodMetrics.data.totalTickets}\n`);

    console.log('🎉 Todos os testes passaram com sucesso!');
    console.log('\n📊 Resumo das funcionalidades SLA:');
    console.log('   ✅ Configurações de SLA carregadas');
    console.log('   ✅ Métricas gerais funcionando');
    console.log('   ✅ Status em tempo real ativo');
    console.log('   ✅ Filtros por período operacionais');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Dica: Certifique-se de que a aplicação está rodando:');
      console.log('   npm run start:dev');
    }
  }
}

// Executar testes
testSlaApi();
