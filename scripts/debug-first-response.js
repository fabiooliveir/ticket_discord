const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function debugFirstResponse() {
  console.log('🔍 Debug da captura de primeira resposta...\n');

  try {
    // 1. Verificar tickets detalhados
    console.log('1️⃣ Analisando tickets detalhados...');
    const ticketsResponse = await axios.get(`${API_BASE_URL}/tickets`);
    const tickets = ticketsResponse.data;
    
    console.log(`📊 Total de tickets: ${tickets.length}\n`);
    
    tickets.forEach((ticket, index) => {
      console.log(`Ticket #${ticket.id} (${index + 1}/${tickets.length}):`);
      console.log(`   - Status: ${ticket.status}`);
      console.log(`   - AssignedTo: ${ticket.assignedTo || 'N/A'}`);
      console.log(`   - FirstResponseCaptured: ${ticket.firstResponseCaptured}`);
      console.log(`   - FirstResponseAt: ${ticket.firstResponseAt || 'N/A'}`);
      console.log(`   - ResponseTimeMinutes: ${ticket.responseTimeMinutes || 'N/A'}`);
      console.log(`   - ThreadId: ${ticket.metadata?.threadId || 'N/A'}`);
      console.log(`   - CreatedAt: ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}`);
      console.log('');
    });

    // 2. Verificar tickets com agente atribuído
    console.log('2️⃣ Tickets com agente atribuído:');
    const ticketsWithAgent = tickets.filter(t => t.assignedTo);
    console.log(`   - Total: ${ticketsWithAgent.length}`);
    
    if (ticketsWithAgent.length > 0) {
      ticketsWithAgent.forEach(ticket => {
        console.log(`   - Ticket #${ticket.id}: ${ticket.assignedTo} (${ticket.status})`);
      });
    }

    // 3. Verificar tickets sem primeira resposta
    console.log('\n3️⃣ Tickets sem primeira resposta:');
    const ticketsWithoutFirstResponse = tickets.filter(t => !t.firstResponseCaptured || !t.firstResponseAt);
    console.log(`   - Total: ${ticketsWithoutFirstResponse.length}`);
    
    if (ticketsWithoutFirstResponse.length > 0) {
      ticketsWithoutFirstResponse.forEach(ticket => {
        console.log(`   - Ticket #${ticket.id}: ${ticket.assignedTo ? 'Tem agente' : 'Sem agente'} (${ticket.status})`);
      });
    }

    // 4. Verificar tickets com thread
    console.log('\n4️⃣ Tickets com thread associada:');
    const ticketsWithThread = tickets.filter(t => t.metadata?.threadId);
    console.log(`   - Total: ${ticketsWithThread.length}`);
    
    if (ticketsWithThread.length > 0) {
      ticketsWithThread.forEach(ticket => {
        console.log(`   - Ticket #${ticket.id}: Thread ${ticket.metadata.threadId}`);
      });
    }

    // 5. Verificar tickets prontos para captura
    console.log('\n5️⃣ Tickets prontos para captura de primeira resposta:');
    const readyForCapture = tickets.filter(t => 
      t.assignedTo && 
      !t.firstResponseCaptured && 
      t.metadata?.threadId &&
      t.status !== 'closed'
    );
    console.log(`   - Total: ${readyForCapture.length}`);
    
    if (readyForCapture.length > 0) {
      readyForCapture.forEach(ticket => {
        console.log(`   - Ticket #${ticket.id}: Agente ${ticket.assignedTo}, Thread ${ticket.metadata.threadId}`);
      });
    }

    // 6. Verificar logs do servidor
    console.log('\n6️⃣ Verificando logs do servidor...');
    console.log('   - Verifique se há logs de "Primeira resposta capturada"');
    console.log('   - Verifique se há logs de "Mensagem rejeitada"');
    console.log('   - Verifique se há logs de "Thread não possui ticket associado"');

    // 7. Possíveis problemas
    console.log('\n7️⃣ Possíveis problemas identificados:');
    
    if (ticketsWithAgent.length === 0) {
      console.log('   ❌ Nenhum ticket tem agente atribuído');
      console.log('   💡 Solução: Puxe um ticket para você primeiro');
    }
    
    if (ticketsWithThread.length === 0) {
      console.log('   ❌ Nenhum ticket tem thread associada');
      console.log('   💡 Solução: Verifique se os threads estão sendo criados');
    }
    
    if (readyForCapture.length === 0) {
      console.log('   ❌ Nenhum ticket está pronto para captura');
      console.log('   💡 Solução: Verifique se os tickets têm agente e thread');
    }

    console.log('\n🎯 Próximos passos para testar:');
    console.log('   1. Crie um novo ticket');
    console.log('   2. Puxe o ticket para você');
    console.log('   3. Envie uma mensagem no thread');
    console.log('   4. Verifique os logs do servidor');
    console.log('   5. Execute este script novamente');

  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
  }
}

// Executar debug
debugFirstResponse();
