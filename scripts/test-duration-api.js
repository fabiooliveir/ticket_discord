const axios = require('axios');

async function testDurationApi() {
  console.log('🧪 Testando APIs de SLA de Duração...\n');

  const baseURL = 'http://localhost:3000';
  
  try {
    // 1. Testar endpoint de overview (sem auth para verificar se está funcionando)
    console.log('📊 1. Testando endpoint de overview...');
    try {
      const overviewResponse = await axios.get(`${baseURL}/dashboard/overview`);
      console.log('   ✅ Overview endpoint funcionando');
      console.log('   📋 Dados recebidos:', Object.keys(overviewResponse.data));
      
      if (overviewResponse.data.summary && overviewResponse.data.summary.durationSla) {
        console.log('   🎯 Métricas de duração encontradas!');
        console.log('   📊 Duração média:', overviewResponse.data.summary.durationSla.averageDurationTime);
        console.log('   📊 Compliance:', overviewResponse.data.summary.durationSla.durationComplianceRate + '%');
      } else {
        console.log('   ⚠️ Métricas de duração não encontradas no overview');
      }
    } catch (error) {
      console.log('   ❌ Erro no overview:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 2. Testar endpoint de métricas de duração
    console.log('\n📊 2. Testando endpoint de métricas de duração...');
    try {
      const durationResponse = await axios.get(`${baseURL}/dashboard/duration-sla?period=month`);
      console.log('   ✅ Duration SLA endpoint funcionando');
      console.log('   📋 Dados recebidos:', Object.keys(durationResponse.data));
    } catch (error) {
      console.log('   ❌ Erro no duration-sla:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 3. Testar endpoint de prioridade
    console.log('\n📊 3. Testando endpoint de prioridade...');
    try {
      const priorityResponse = await axios.get(`${baseURL}/dashboard/duration-sla/priority?period=month`);
      console.log('   ✅ Priority endpoint funcionando');
      console.log('   📋 Dados recebidos:', Object.keys(priorityResponse.data));
    } catch (error) {
      console.log('   ❌ Erro no priority:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 4. Testar endpoint de tendências
    console.log('\n📊 4. Testando endpoint de tendências...');
    try {
      const trendsResponse = await axios.get(`${baseURL}/dashboard/duration-sla/trends?period=month`);
      console.log('   ✅ Trends endpoint funcionando');
      console.log('   📋 Dados recebidos:', Object.keys(trendsResponse.data));
    } catch (error) {
      console.log('   ❌ Erro no trends:', error.response?.status, error.response?.data?.message || error.message);
    }

    // 5. Testar endpoint de alertas
    console.log('\n📊 5. Testando endpoint de alertas...');
    try {
      const alertsResponse = await axios.get(`${baseURL}/dashboard/duration-sla/alerts`);
      console.log('   ✅ Alerts endpoint funcionando');
      console.log('   📋 Dados recebidos:', Object.keys(alertsResponse.data));
    } catch (error) {
      console.log('   ❌ Erro no alerts:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Teste de APIs concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testDurationApi()
    .then(() => {
      console.log('\n🎯 Teste de APIs de duração finalizado!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha no teste de APIs:', error);
      process.exit(1);
    });
}

module.exports = { testDurationApi };

