const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando migração para campos de SLA de duração...\n');

try {
  // Executar a migração
  console.log('📊 Executando migração AddDurationSlaFieldsToTickets...');
  execSync('npm run migration:run', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Migração executada com sucesso!');
  console.log('📋 Campos adicionados:');
  console.log('   - durationTimeMinutes: Tempo total de duração em minutos');
  console.log('   - durationSlaStatus: Status do SLA de duração');
  console.log('\n🎯 Próximos passos:');
  console.log('   1. Implementar lógica de cálculo no SlaService');
  console.log('   2. Atualizar fluxo de arquivamento no Discord');
  console.log('   3. Estender métricas do Dashboard');
  
} catch (error) {
  console.error('❌ Erro ao executar migração:', error.message);
  process.exit(1);
}

