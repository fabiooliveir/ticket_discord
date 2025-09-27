const axios = require('axios');
require('dotenv').config();

async function testLeadfyApi() {
  const config = {
    webhookUrl: process.env.LEADFY_WEBHOOK_URL || 'https://workflowinternal.leadfy.pro/webhook/241b97c5-f29c-4215-be94-531a4e490a7d',
    token: process.env.LEADFY_TOKEN || '0GZf0zkLIR5RdK9goaFBrHRRZyvm4VplBtIABZ0q5clUg3H2h9XUiVwkVMhQfzbB',
  };

  try {
    console.log('🔍 Testando conexão com API Leadfy...');
    console.log(`📡 URL: ${config.webhookUrl}`);
    console.log(`🔑 Token: ${config.token.substring(0, 10)}...`);

    const response = await axios.post(
      config.webhookUrl,
      {},
      {
        headers: {
          'token': config.token,
          'Content-Type': 'application/json',
          'User-Agent': 'TicketDiscordBot/1.0.0',
        },
        timeout: 10000,
      }
    );

    console.log('✅ Conexão bem-sucedida!');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Dados recebidos:`, JSON.stringify(response.data, null, 2));

    if (response.data && Array.isArray(response.data)) {
      console.log(`👥 Total de clientes: ${response.data.length}`);
      
      if (response.data.length > 0) {
        console.log('📝 Primeiro cliente:');
        console.log(JSON.stringify(response.data[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Erro ao conectar com API Leadfy:');
    console.error(`Status: ${error.response?.status}`);
    console.error(`Mensagem: ${error.message}`);
    
    if (error.response?.data) {
      console.error('Resposta da API:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

testLeadfyApi();
