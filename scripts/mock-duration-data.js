// Script para gerar dados mockados de SLA de duração para teste do frontend

const mockDashboardData = {
  summary: {
    totalTickets: 150,
    openTickets: 25,
    closedTickets: 125,
    complianceRate: 87,
    averageResponseTime: 45,
    averageResolutionTime: 180,
    slaBreaches: 8,
    // Fase 3: Métricas de SLA de Duração
    durationSla: {
      averageDurationTime: 480, // 8 horas
      durationComplianceRate: 92,
      ticketsWithDuration: 125,
      ticketsWithoutDuration: 25,
      slaBreaches: 3,
      slaAtRisk: 7,
      performanceByPriority: {
        critical: { 
          avgTime: 120, 
          complianceRate: 95, 
          total: 15 
        },
        high: { 
          avgTime: 360, 
          complianceRate: 90, 
          total: 35 
        },
        medium: { 
          avgTime: 720, 
          complianceRate: 88, 
          total: 50 
        },
        low: { 
          avgTime: 1440, 
          complianceRate: 85, 
          total: 25 
        }
      }
    }
  },
  trends: {
    ticketsCreatedToday: 12,
    ticketsClosedToday: 8,
    ticketsCreatedThisWeek: 45,
    ticketsClosedThisWeek: 38,
    ticketsCreatedThisMonth: 180,
    ticketsClosedThisMonth: 155
  },
  performance: {
    topPerformingAgents: [
      {
        agentId: 'agent1',
        ticketsResolved: 45,
        averageResolutionTime: 120,
        complianceRate: 95
      },
      {
        agentId: 'agent2',
        ticketsResolved: 38,
        averageResolutionTime: 150,
        complianceRate: 92
      }
    ],
    slaPerformance: {
      critical: { compliant: 14, total: 15, rate: 93 },
      high: { compliant: 32, total: 35, rate: 91 },
      medium: { compliant: 44, total: 50, rate: 88 },
      low: { compliant: 21, total: 25, rate: 84 }
    }
  },
  alerts: [
    {
      type: 'breach',
      message: '3 tickets violaram SLA de duração',
      count: 3,
      priority: 'high'
    },
    {
      type: 'at_risk',
      message: '7 tickets próximos de violar SLA de duração',
      count: 7,
      priority: 'medium'
    }
  ]
};

// Salvar dados mockados em arquivo JSON
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'frontend', 'public', 'mock-dashboard-data.json');

fs.writeFileSync(outputPath, JSON.stringify(mockDashboardData, null, 2));

console.log('✅ Dados mockados de SLA de duração criados!');
console.log('📁 Arquivo salvo em:', outputPath);
console.log('\n📊 Dados incluídos:');
console.log('   - Duração média total: 8 horas');
console.log('   - Compliance de duração: 92%');
console.log('   - Tickets com duração: 125');
console.log('   - Violações de duração: 3');
console.log('   - Tickets em risco: 7');
console.log('   - Performance por prioridade: Crítica, Alta, Média, Baixa');

console.log('\n🎯 Para usar no frontend:');
console.log('   1. Acesse o arquivo mock-dashboard-data.json');
console.log('   2. Use os dados para testar a interface');
console.log('   3. Verifique se os cards de duração aparecem corretamente');

