const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testMessageValidation() {
  console.log('🔍 Testando validação de mensagens...\n');

  try {
    // 1. Verificar tickets prontos para captura
    console.log('1️⃣ Verificando tickets prontos para captura...');
    const ticketsResponse = await axios.get(`${API_BASE_URL}/tickets`);
    const tickets = ticketsResponse.data;
    
    const readyForCapture = tickets.filter(t => 
      t.assignedTo && 
      !t.firstResponseCaptured && 
      t.metadata?.threadId &&
      t.status !== 'closed'
    );
    
    console.log(`📊 Tickets prontos para captura: ${readyForCapture.length}`);
    
    if (readyForCapture.length > 0) {
      console.log('\n📋 Tickets prontos:');
      readyForCapture.forEach(ticket => {
        console.log(`   - Ticket #${ticket.id}: Agente ${ticket.assignedTo}, Thread ${ticket.metadata.threadId}, Status: ${ticket.status}`);
      });
    }

    // 2. Verificar possíveis problemas de validação
    console.log('\n2️⃣ Verificando possíveis problemas de validação...');
    console.log('✅ Validações que podem estar rejeitando mensagens:');
    console.log('   - Mensagem muito curta (< 2 caracteres)');
    console.log('   - Mensagem de teste (contém "test" e < 10 caracteres)');
    console.log('   - Mensagem de erro (contém "error" ou "exception")');
    console.log('   - Spam (caracteres repetitivos ou palavras repetitivas)');
    console.log('   - Apenas emojis');
    console.log('   - Apenas menções ou reações');

    // 3. Simular diferentes tipos de mensagem
    console.log('\n3️⃣ Simulando diferentes tipos de mensagem...');
    const testMessages = [
      { content: 'Olá', description: 'Mensagem simples' },
      { content: 'Vou fazer', description: 'Mensagem de trabalho' },
      { content: 'test', description: 'Mensagem de teste (pode ser rejeitada)' },
      { content: '👍', description: 'Apenas emoji (será rejeitada)' },
      { content: 'error', description: 'Mensagem de erro (pode ser rejeitada)' },
      { content: 'aaaaaaaaa', description: 'Caracteres repetitivos (pode ser rejeitada)' },
      { content: 'Vou analisar o problema e resolver', description: 'Mensagem completa' },
      { content: 'Ok, entendi', description: 'Mensagem de confirmação' },
    ];

    testMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. "${msg.content}" - ${msg.description}`);
    });

    // 4. Verificar logs do servidor
    console.log('\n4️⃣ Verificando logs do servidor...');
    console.log('   - Procure por logs de "Mensagem rejeitada"');
    console.log('   - Procure por logs de "Confiança muito baixa"');
    console.log('   - Procure por logs de "Primeira resposta capturada"');
    console.log('   - Procure por logs de "Thread não possui ticket associado"');

    // 5. Sugestões para testar
    console.log('\n5️⃣ Sugestões para testar a captura:');
    console.log('   ✅ Use mensagens mais longas e descritivas');
    console.log('   ✅ Evite palavras como "test", "error", "exception"');
    console.log('   ✅ Evite apenas emojis ou caracteres repetitivos');
    console.log('   ✅ Use mensagens como:');
    console.log('      - "Vou analisar o problema e resolver"');
    console.log('      - "Ok, entendi. Vou trabalhar nisso"');
    console.log('      - "Vou verificar e retornar em breve"');
    console.log('      - "Iniciando análise do ticket"');

    // 6. Verificar se o event listener está funcionando
    console.log('\n6️⃣ Verificando event listener...');
    console.log('   - Event listener está registrado em src/discord/discord.bot.ts');
    console.log('   - Evento: Events.MessageCreate');
    console.log('   - Método: messageHandlerService.handleThreadMessage()');
    console.log('   - Verifique se o bot está online e conectado');

    // 7. Próximos passos
    console.log('\n7️⃣ Próximos passos para testar:');
    console.log('   1. Vá para um dos threads dos tickets prontos');
    console.log('   2. Envie uma mensagem longa e descritiva');
    console.log('   3. Verifique os logs do servidor');
    console.log('   4. Execute este script novamente para verificar se foi capturada');

    console.log('\n🎯 Tickets específicos para testar:');
    if (readyForCapture.length > 0) {
      const ticket = readyForCapture[0];
      console.log(`   - Ticket #${ticket.id}`);
      console.log(`   - Thread ID: ${ticket.metadata.threadId}`);
      console.log(`   - Agente: ${ticket.assignedTo}`);
      console.log(`   - Status: ${ticket.status}`);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
  }
}

// Executar teste
testMessageValidation();
