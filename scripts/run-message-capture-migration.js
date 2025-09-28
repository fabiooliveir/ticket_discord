#!/usr/bin/env node

/**
 * Script para executar migração de captura de primeira resposta
 * 
 * Este script executa a migração que adiciona o campo firstResponseCaptured
 * à tabela tickets para suportar captura automática de primeira resposta SLA.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Executando migração de captura de primeira resposta SLA...\n');

try {
  // Verificar se o arquivo de migração existe
  const migrationFile = path.join(__dirname, '../src/database/migrations/AddFirstResponseCapturedToTickets.ts');
  
  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Arquivo de migração não encontrado:', migrationFile);
    process.exit(1);
  }

  console.log('✅ Arquivo de migração encontrado');
  console.log('📋 Migração: AddFirstResponseCapturedToTickets');
  console.log('');

  // Verificar se TypeORM CLI está disponível
  try {
    execSync('npx typeorm --version', { stdio: 'pipe' });
    console.log('✅ TypeORM CLI disponível');
  } catch (error) {
    console.log('⚠️ TypeORM CLI não encontrado, tentando execução direta...');
  }

  // Executar migração
  console.log('🔄 Executando migração...');
  
  try {
    // Tentar executar via npm script primeiro
    execSync('npm run migration:run', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Script npm não encontrado, tentando execução direta...');
    
    // Executar diretamente via TypeORM
    execSync('npx typeorm migration:run', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
  }

  console.log('');
  console.log('✅ Migração executada com sucesso!');
  console.log('');
  console.log('📊 Campo adicionado à tabela tickets:');
  console.log('  - firstResponseCaptured: boolean (default: false)');
  console.log('');
  console.log('🎯 Próximos passos:');
  console.log('  1. Reiniciar aplicação para carregar mudanças');
  console.log('  2. Testar captura com tickets reais');
  console.log('  3. Monitorar logs de captura');
  console.log('  4. Verificar estatísticas via API');
  console.log('');
  console.log('📡 Endpoints disponíveis:');
  console.log('  - GET /sla/capture/pending');
  console.log('  - GET /sla/capture/stats');
  console.log('  - POST /sla/capture/force-pending');
  console.log('');
  console.log('🧪 Para testar a implementação:');
  console.log('  npm run test:message-capture');

} catch (error) {
  console.error('❌ Erro ao executar migração:', error.message);
  console.log('');
  console.log('🔧 Soluções possíveis:');
  console.log('  1. Verificar se o banco de dados está rodando');
  console.log('  2. Verificar configurações de conexão no ormconfig.ts');
  console.log('  3. Executar migração manualmente via TypeORM CLI');
  console.log('  4. Verificar permissões de banco de dados');
  console.log('');
  console.log('📋 Execução manual:');
  console.log('  npx typeorm migration:run -d ormconfig.ts');
  
  process.exit(1);
}
