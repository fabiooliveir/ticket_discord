const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Inserindo configurações padrão de SLA...');

try {
  // Verificar se já existem configurações
  const checkResult = execSync('curl -s http://localhost:3000/sla/configs', { 
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..')
  });

  const configs = JSON.parse(checkResult);
  
  if (configs.length > 0) {
    console.log(`✅ ${configs.length} configurações já existem no sistema.`);
    console.log('Configurações encontradas:');
    configs.forEach(config => {
      console.log(`   - ${config.name} (${config.priority})`);
    });
    return;
  }

  console.log('📝 Inserindo configurações padrão...');

  const defaultConfigs = [
    {
      name: 'Crítico - Business Hours',
      category: 'business_hours',
      priority: 'critical',
      responseTimeTarget: 15,
      resolutionTimeTarget: 120,
      description: 'SLA para tickets críticos em horário comercial'
    },
    {
      name: 'Alta Prioridade - Business Hours',
      category: 'business_hours',
      priority: 'high',
      responseTimeTarget: 30,
      resolutionTimeTarget: 240,
      description: 'SLA para tickets de alta prioridade em horário comercial'
    },
    {
      name: 'Média Prioridade - Business Hours',
      category: 'business_hours',
      priority: 'medium',
      responseTimeTarget: 120,
      resolutionTimeTarget: 1440,
      description: 'SLA para tickets de média prioridade em horário comercial'
    },
    {
      name: 'Baixa Prioridade - Business Hours',
      category: 'business_hours',
      priority: 'low',
      responseTimeTarget: 480,
      resolutionTimeTarget: 4320,
      description: 'SLA para tickets de baixa prioridade em horário comercial'
    },
    {
      name: 'Crítico - After Hours',
      category: 'after_hours',
      priority: 'critical',
      responseTimeTarget: 60,
      resolutionTimeTarget: 480,
      description: 'SLA para tickets críticos fora do horário comercial'
    },
    {
      name: 'Alta Prioridade - After Hours',
      category: 'after_hours',
      priority: 'high',
      responseTimeTarget: 240,
      resolutionTimeTarget: 960,
      description: 'SLA para tickets de alta prioridade fora do horário comercial'
    },
    {
      name: 'Média Prioridade - After Hours',
      category: 'after_hours',
      priority: 'medium',
      responseTimeTarget: 480,
      resolutionTimeTarget: 2880,
      description: 'SLA para tickets de média prioridade fora do horário comercial'
    },
    {
      name: 'Baixa Prioridade - After Hours',
      category: 'after_hours',
      priority: 'low',
      responseTimeTarget: 1440,
      resolutionTimeTarget: 8640,
      description: 'SLA para tickets de baixa prioridade fora do horário comercial'
    }
  ];

  for (const config of defaultConfigs) {
    try {
      const result = execSync(`curl -s -X POST http://localhost:3000/sla/configs -H "Content-Type: application/json" -d '${JSON.stringify(config)}'`, {
        encoding: 'utf8',
        cwd: path.resolve(__dirname, '..')
      });
      
      console.log(`   ✅ ${config.name} inserida`);
    } catch (error) {
      console.log(`   ❌ Erro ao inserir ${config.name}: ${error.message}`);
    }
  }

  console.log('\n🎉 Configurações padrão inseridas com sucesso!');
  console.log('\n📊 Verificando configurações inseridas...');
  
  const finalCheck = execSync('curl -s http://localhost:3000/sla/configs', { 
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..')
  });

  const finalConfigs = JSON.parse(finalCheck);
  console.log(`✅ Total de configurações: ${finalConfigs.length}`);

} catch (error) {
  console.error('❌ Erro ao inserir configurações:', error.message);
  process.exit(1);
}
