const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Configurando módulo SLA...');

try {
  // Executar migrações para adicionar campos SLA
  console.log('📊 Executando migração para adicionar campos SLA aos tickets...');
  execSync('npm run migration:run', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });

  console.log('✅ Configuração do SLA concluída com sucesso!');
  console.log('');
  console.log('📋 Endpoints SLA disponíveis:');
  console.log('  GET /sla/metrics - Métricas gerais de SLA');
  console.log('  GET /sla/metrics/period - Métricas por período');
  console.log('  GET /sla/configs - Configurações de SLA');
  console.log('  GET /sla/status - Status atual de SLA');
  console.log('');
  console.log('🎯 Configurações padrão de SLA criadas:');
  console.log('  - Crítico: 15min resposta, 2h resolução');
  console.log('  - Alta: 30min resposta, 4h resolução');
  console.log('  - Média: 2h resposta, 24h resolução');
  console.log('  - Baixa: 8h resposta, 72h resolução');

} catch (error) {
  console.error('❌ Erro ao configurar SLA:', error.message);
  process.exit(1);
}
