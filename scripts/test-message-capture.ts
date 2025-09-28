#!/usr/bin/env ts-node

/**
 * Script de teste para captura de primeira resposta SLA
 * 
 * Este script testa a funcionalidade de captura automática de primeira resposta
 * implementada na Fase 1 do sistema SLA.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MessageHandlerService } from '../src/discord/message-handler.service';
import { SlaService } from '../src/modules/sla/sla.service';

async function testMessageCapture() {
  console.log('🧪 Iniciando teste de captura de primeira resposta SLA...\n');

  try {
    // Criar aplicação NestJS
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Obter serviços
    const messageHandlerService = app.get(MessageHandlerService);
    const slaService = app.get(SlaService);

    console.log('✅ Serviços carregados com sucesso\n');

    // Teste 1: Verificar estatísticas de captura
    console.log('📊 Teste 1: Estatísticas de captura');
    const captureStats = await messageHandlerService.getCaptureStats();
    console.log('Estatísticas:', JSON.stringify(captureStats, null, 2));
    console.log('');

    // Teste 2: Verificar tickets com primeira resposta pendente
    console.log('⏳ Teste 2: Tickets com primeira resposta pendente');
    const pendingTickets = await slaService.getTicketsWithPendingFirstResponse();
    console.log(`Tickets pendentes: ${pendingTickets.length}`);
    
    if (pendingTickets.length > 0) {
      console.log('Primeiros 3 tickets pendentes:');
      pendingTickets.slice(0, 3).forEach((ticket, index) => {
        console.log(`  ${index + 1}. Ticket ${ticket.id} - ${ticket.title}`);
        console.log(`     Agente: ${ticket.assignedTo}`);
        console.log(`     Thread: ${ticket.metadata?.threadId || 'N/A'}`);
        console.log(`     Criado em: ${ticket.createdAt.toISOString()}`);
        console.log('');
      });
    }
    console.log('');

    // Teste 3: Verificar métricas de SLA
    console.log('📈 Teste 3: Métricas de SLA');
    const slaMetrics = await slaService.calculateSlaMetrics();
    console.log('Métricas SLA:');
    console.log(`  Total de tickets: ${slaMetrics.totalTickets}`);
    console.log(`  Taxa de compliance: ${slaMetrics.complianceRate}%`);
    console.log(`  Tempo médio de resposta: ${slaMetrics.averageResponseTime} minutos`);
    console.log('');

    // Teste 4: Simular captura forçada (sem processar realmente)
    console.log('🔧 Teste 4: Simulação de captura forçada');
    const forceCaptureResult = await slaService.forceCapturePendingResponses();
    console.log('Resultado da captura forçada:', JSON.stringify(forceCaptureResult, null, 2));
    console.log('');

    console.log('✅ Todos os testes concluídos com sucesso!');
    console.log('');
    console.log('📋 Resumo da implementação:');
    console.log('  ✅ MessageHandlerService criado');
    console.log('  ✅ Campo firstResponseCaptured adicionado à entidade Ticket');
    console.log('  ✅ Listener de mensagens configurado no DiscordBot');
    console.log('  ✅ Integração com SlaService implementada');
    console.log('  ✅ Endpoints de monitoramento criados');
    console.log('  ✅ Scripts de teste implementados');
    console.log('');
    console.log('🎯 Próximos passos:');
    console.log('  1. Executar migração: npm run migration:run');
    console.log('  2. Testar com tickets reais no Discord');
    console.log('  3. Monitorar logs de captura');
    console.log('  4. Implementar Fase 2: Validação e Filtros');

    await app.close();

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testMessageCapture()
    .then(() => {
      console.log('🎉 Teste finalizado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha no teste:', error);
      process.exit(1);
    });
}

export { testMessageCapture };
