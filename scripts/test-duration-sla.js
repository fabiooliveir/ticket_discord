const { SlaCalculator } = require('../dist/shared/utils/sla-calculator.util');
const { TicketPriority, SlaCategories } = require('../dist/shared/enums/sla-categories.enum');
const { SlaStatus } = require('../dist/shared/enums/sla-targets.enum');

console.log('🧪 Testando implementação de SLA de duração...\n');

// Dados de teste
const testCases = [
  {
    name: 'Ticket Crítico - Dentro do prazo',
    priority: TicketPriority.CRITICAL,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    closedAt: new Date('2024-01-01T12:00:00Z'), // 2 horas
    expectedStatus: SlaStatus.COMPLIANT,
  },
  {
    name: 'Ticket Crítico - Fora do prazo',
    priority: TicketPriority.CRITICAL,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    closedAt: new Date('2024-01-01T16:00:00Z'), // 6 horas
    expectedStatus: SlaStatus.BREACHED,
  },
  {
    name: 'Ticket Alta Prioridade - Dentro do prazo',
    priority: TicketPriority.HIGH,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    closedAt: new Date('2024-01-01T14:00:00Z'), // 4 horas
    expectedStatus: SlaStatus.COMPLIANT,
  },
  {
    name: 'Ticket Alta Prioridade - Em risco',
    priority: TicketPriority.HIGH,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    closedAt: new Date('2024-01-01T19:00:00Z'), // 9 horas (em risco)
    expectedStatus: SlaStatus.AT_RISK,
  },
  {
    name: 'Ticket Média Prioridade - Dentro do prazo',
    priority: TicketPriority.MEDIUM,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    closedAt: new Date('2024-01-01T22:00:00Z'), // 12 horas
    expectedStatus: SlaStatus.COMPLIANT,
  },
  {
    name: 'Ticket Baixa Prioridade - Em risco',
    priority: TicketPriority.LOW,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    closedAt: new Date('2024-01-03T22:00:00Z'), // 60 horas (em risco)
    expectedStatus: SlaStatus.AT_RISK,
  },
];

let passed = 0;
let failed = 0;

console.log('📊 Executando testes de SLA de duração...\n');

testCases.forEach((testCase, index) => {
  try {
    // Calcular duração
    const durationMinutes = SlaCalculator.calculateDurationTime(
      testCase.createdAt,
      testCase.closedAt,
      SlaCategories.BUSINESS_HOURS
    );

    // Obter status
    const actualStatus = SlaCalculator.getDurationSlaStatus(
      durationMinutes,
      testCase.priority
    );

    // Obter target
    const target = SlaCalculator.getDurationTimeTarget(testCase.priority);

    // Verificar resultado
    const success = actualStatus === testCase.expectedStatus;
    
    if (success) {
      passed++;
      console.log(`✅ Teste ${index + 1}: ${testCase.name}`);
    } else {
      failed++;
      console.log(`❌ Teste ${index + 1}: ${testCase.name}`);
      console.log(`   Esperado: ${testCase.expectedStatus}`);
      console.log(`   Obtido: ${actualStatus}`);
    }

    console.log(`   Duração: ${durationMinutes}min (Target: ${target}min)`);
    console.log(`   Status: ${actualStatus}\n`);

  } catch (error) {
    failed++;
    console.log(`❌ Teste ${index + 1}: ${testCase.name} - ERRO`);
    console.log(`   Erro: ${error.message}\n`);
  }
});

// Resumo dos testes
console.log('📈 Resumo dos testes:');
console.log(`   ✅ Passou: ${passed}`);
console.log(`   ❌ Falhou: ${failed}`);
console.log(`   📊 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 Todos os testes passaram! Implementação de SLA de duração está funcionando corretamente.');
} else {
  console.log('\n⚠️ Alguns testes falharam. Verifique a implementação.');
  process.exit(1);
}
