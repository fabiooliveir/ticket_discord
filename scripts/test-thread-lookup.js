const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testThreadLookup() {
  console.log('🔍 Testando busca de ticket por threadId...\n');

  try {
    // 1. Buscar todos os tickets
    console.log('1️⃣ Buscando todos os tickets...');
    const ticketsResponse = await axios.get(`${API_BASE_URL}/tickets`);
    const tickets = ticketsResponse.data;
    
    console.log(`📊 Total de tickets: ${tickets.length}`);

    // 2. Verificar tickets com threadId
    console.log('\n2️⃣ Tickets com threadId:');
    const ticketsWithThread = tickets.filter(t => t.metadata?.threadId);
    console.log(`   - Total: ${ticketsWithThread.length}`);
    
    ticketsWithThread.forEach(ticket => {
      console.log(`   - Ticket #${ticket.id}: Thread ${ticket.metadata.threadId}`);
      console.log(`     Metadata: ${JSON.stringify(ticket.metadata)}`);
    });

    // 3. Testar consulta específica para o threadId problemático
    console.log('\n3️⃣ Testando consulta para threadId problemático...');
    const problemThreadId = '1421872934380634245';
    
    // Buscar ticket específico
    const specificTicket = tickets.find(t => t.metadata?.threadId === problemThreadId);
    if (specificTicket) {
      console.log(`✅ Ticket encontrado: #${specificTicket.id}`);
      console.log(`   - ThreadId: ${specificTicket.metadata.threadId}`);
      console.log(`   - AssignedTo: ${specificTicket.assignedTo}`);
      console.log(`   - Status: ${specificTicket.status}`);
      console.log(`   - FirstResponseCaptured: ${specificTicket.firstResponseCaptured}`);
    } else {
      console.log('❌ Ticket não encontrado para o threadId problemático');
    }

    // 4. Verificar estrutura do metadata
    console.log('\n4️⃣ Verificando estrutura do metadata...');
    if (ticketsWithThread.length > 0) {
      const sampleTicket = ticketsWithThread[0];
      console.log('📋 Estrutura do metadata:');
      console.log(`   - Tipo: ${typeof sampleTicket.metadata}`);
      console.log(`   - ThreadId: ${sampleTicket.metadata.threadId}`);
      console.log(`   - Tipo do ThreadId: ${typeof sampleTicket.metadata.threadId}`);
      console.log(`   - JSON completo: ${JSON.stringify(sampleTicket.metadata, null, 2)}`);
    }

    // 5. Verificar se há problemas de tipo
    console.log('\n5️⃣ Verificando tipos de dados...');
    const threadIds = ticketsWithThread.map(t => t.metadata.threadId);
    const uniqueTypes = [...new Set(threadIds.map(id => typeof id))];
    console.log(`   - Tipos de threadId encontrados: ${uniqueTypes.join(', ')}`);
    
    const stringIds = threadIds.filter(id => typeof id === 'string');
    const numberIds = threadIds.filter(id => typeof id === 'number');
    console.log(`   - ThreadIds como string: ${stringIds.length}`);
    console.log(`   - ThreadIds como number: ${numberIds.length}`);

    // 6. Simular consulta SQL
    console.log('\n6️⃣ Simulando consulta SQL...');
    console.log('   - Query: ticket.metadata->>\'threadId\' = :threadId');
    console.log(`   - ThreadId: ${problemThreadId}`);
    console.log(`   - Tipo: ${typeof problemThreadId}`);
    
    // Verificar se o threadId está sendo comparado corretamente
    const matchingTickets = tickets.filter(t => 
      t.metadata?.threadId && 
      t.metadata.threadId.toString() === problemThreadId
    );
    console.log(`   - Tickets encontrados: ${matchingTickets.length}`);

    // 7. Possíveis problemas
    console.log('\n7️⃣ Possíveis problemas identificados:');
    
    if (uniqueTypes.length > 1) {
      console.log('   ❌ Inconsistência de tipos: threadIds misturados (string/number)');
    }
    
    if (matchingTickets.length === 0) {
      console.log('   ❌ Nenhum ticket encontrado com o threadId problemático');
    }
    
    if (stringIds.length !== threadIds.length) {
      console.log('   ❌ Alguns threadIds não são strings');
    }

    console.log('\n🎯 Próximos passos:');
    console.log('   1. Verificar se o threadId está sendo armazenado como string');
    console.log('   2. Verificar se a consulta SQL está funcionando');
    console.log('   3. Verificar se há problemas de cache');
    console.log('   4. Testar com um ticket específico');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
  }
}

// Executar teste
testThreadLookup();
