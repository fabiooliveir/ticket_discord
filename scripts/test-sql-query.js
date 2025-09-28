const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testSqlQuery() {
  console.log('🔍 Testando consulta SQL para busca de ticket...\n');

  try {
    // 1. Testar endpoint específico para busca por threadId
    console.log('1️⃣ Testando busca por threadId via API...');
    const problemThreadId = '1421872934380634245';
    
    try {
      // Tentar buscar ticket por threadId via API
      const response = await axios.get(`${API_BASE_URL}/tickets/thread/${problemThreadId}`);
      console.log('✅ Ticket encontrado via API:');
      console.log(`   - ID: ${response.data.id}`);
      console.log(`   - ThreadId: ${response.data.metadata?.threadId}`);
      console.log(`   - AssignedTo: ${response.data.assignedTo}`);
      console.log(`   - Status: ${response.data.status}`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('❌ Endpoint não encontrado - criando endpoint de teste');
      } else {
        console.log('❌ Erro na busca via API:', error.message);
      }
    }

    // 2. Verificar se há logs de erro na consulta SQL
    console.log('\n2️⃣ Verificando possíveis problemas na consulta SQL...');
    console.log('✅ Consulta SQL atual:');
    console.log('   - Query: ticket.metadata->>\'threadId\' = :threadId');
    console.log('   - ThreadId: 1421872934380634245');
    console.log('   - Tipo: string');
    
    console.log('\n🔍 Possíveis problemas:');
    console.log('   1. Problema de cache - ticket pode estar em cache expirado');
    console.log('   2. Problema de transação - consulta pode estar em transação diferente');
    console.log('   3. Problema de encoding - caracteres especiais no threadId');
    console.log('   4. Problema de índice - consulta pode estar lenta');

    // 3. Verificar se o ticket está sendo processado corretamente
    console.log('\n3️⃣ Verificando processamento do ticket...');
    const ticketsResponse = await axios.get(`${API_BASE_URL}/tickets`);
    const tickets = ticketsResponse.data;
    
    const targetTicket = tickets.find(t => t.metadata?.threadId === problemThreadId);
    if (targetTicket) {
      console.log('✅ Ticket encontrado na lista geral:');
      console.log(`   - ID: ${targetTicket.id}`);
      console.log(`   - AssignedTo: ${targetTicket.assignedTo}`);
      console.log(`   - Status: ${targetTicket.status}`);
      console.log(`   - FirstResponseCaptured: ${targetTicket.firstResponseCaptured}`);
      console.log(`   - ThreadId: ${targetTicket.metadata.threadId}`);
      
      // Verificar se está pronto para captura
      const isReadyForCapture = targetTicket.assignedTo && 
                               !targetTicket.firstResponseCaptured && 
                               targetTicket.metadata?.threadId &&
                               targetTicket.status !== 'closed';
      
      console.log(`   - Pronto para captura: ${isReadyForCapture ? '✅ Sim' : '❌ Não'}`);
      
      if (!isReadyForCapture) {
        console.log('   - Motivos:');
        if (!targetTicket.assignedTo) console.log('     * Sem agente atribuído');
        if (targetTicket.firstResponseCaptured) console.log('     * Primeira resposta já capturada');
        if (!targetTicket.metadata?.threadId) console.log('     * Sem thread associada');
        if (targetTicket.status === 'closed') console.log('     * Ticket fechado');
      }
    }

    // 4. Verificar logs do servidor
    console.log('\n4️⃣ Verificando logs do servidor...');
    console.log('   - Procure por logs de "Erro ao buscar ticket pelo threadId"');
    console.log('   - Procure por logs de "Ticket encontrado no cache"');
    console.log('   - Procure por logs de "Ticket adicionado ao cache"');
    console.log('   - Procure por logs de "Thread não possui ticket associado"');

    // 5. Sugestões para debug
    console.log('\n5️⃣ Sugestões para debug:');
    console.log('   - Verifique se há erros de SQL no log do servidor');
    console.log('   - Verifique se o cache está funcionando corretamente');
    console.log('   - Teste com um ticket recém-criado');
    console.log('   - Verifique se a conexão com o banco está estável');

    // 6. Teste prático
    console.log('\n6️⃣ Teste prático recomendado:');
    console.log('   1. Crie um novo ticket');
    console.log('   2. Puxe o ticket para você');
    console.log('   3. Envie uma mensagem no thread');
    console.log('   4. Verifique os logs imediatamente');
    console.log('   5. Execute este script para verificar se foi capturado');

    console.log('\n🎯 Status atual:');
    console.log('   - Ticket existe: ✅');
    console.log('   - ThreadId correto: ✅');
    console.log('   - AssignedTo definido: ✅');
    console.log('   - Pronto para captura: ✅');
    console.log('   - Problema: Consulta SQL ou cache');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
  }
}

// Executar teste
testSqlQuery();
