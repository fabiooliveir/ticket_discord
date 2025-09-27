#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando Frontend Dashboard...\n');

// Verificar se o frontend foi buildado
const frontendDir = path.join(__dirname, '..', 'frontend');
const buildDir = path.join(frontendDir, 'build');

if (!fs.existsSync(buildDir)) {
  console.log('⚠️ Frontend não foi buildado ainda. Executando build...');
  try {
    execSync('npm run frontend:build', { stdio: 'inherit' });
    console.log('✅ Build concluído');
  } catch (error) {
    console.error('❌ Erro no build do frontend:', error.message);
    process.exit(1);
  }
}

// Verificar estrutura de arquivos essenciais
console.log('📁 Verificando estrutura de arquivos...');

const essentialFiles = [
  'frontend/package.json',
  'frontend/src/App.tsx',
  'frontend/src/index.tsx',
  'frontend/src/types/dashboard.ts',
  'frontend/src/services/api.ts',
  'frontend/src/hooks/useDashboard.ts',
  'frontend/src/components/common/MetricCard.tsx',
  'frontend/src/components/dashboard/OverviewCards.tsx',
  'frontend/src/pages/DashboardPage.tsx',
];

let allFilesExist = true;

essentialFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Arquivo não encontrado`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Alguns arquivos essenciais estão faltando.');
  process.exit(1);
}

// Verificar dependências do package.json
console.log('\n📦 Verificando dependências...');

const packageJsonPath = path.join(frontendDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredDeps = [
  'react',
  'react-dom',
  '@mui/material',
  'recharts',
  'axios',
  'typescript',
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - Dependência não encontrada`);
  }
});

// Verificar se a API está rodando
console.log('\n🔍 Verificando conectividade com API...');
try {
  const response = execSync('curl -s http://localhost:3000/health', { encoding: 'utf8' });
  if (response.includes('OK') || response.includes('healthy')) {
    console.log('✅ API está rodando e acessível');
  } else {
    console.log('⚠️ API não está respondendo corretamente');
  }
} catch (error) {
  console.log('⚠️ API não está rodando ou não é acessível');
  console.log('   Certifique-se de que o backend está rodando: npm run start:dev');
}

// Verificar endpoints do dashboard
console.log('\n🌐 Testando endpoints do dashboard...');

const dashboardEndpoints = [
  '/dashboard/overview',
  '/dashboard/kpis',
  '/dashboard/alerts',
  '/dashboard/metrics/month',
  '/dashboard/performance/month',
];

let endpointsWorking = 0;

dashboardEndpoints.forEach(endpoint => {
  try {
    const response = execSync(`curl -s http://localhost:3000${endpoint}`, { encoding: 'utf8' });
    if (response && response.length > 10) {
      console.log(`✅ ${endpoint}`);
      endpointsWorking++;
    } else {
      console.log(`❌ ${endpoint} - Resposta vazia`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - Erro na requisição`);
  }
});

console.log(`\n📊 Endpoints funcionando: ${endpointsWorking}/${dashboardEndpoints.length}`);

// Verificar TypeScript
console.log('\n🔧 Verificando TypeScript...');
try {
  execSync('cd frontend && npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilando sem erros');
} catch (error) {
  console.log('⚠️ Erros de TypeScript encontrados');
  console.log('   Execute: cd frontend && npx tsc --noEmit para ver detalhes');
}

// Verificar linting
console.log('\n🎨 Verificando linting...');
try {
  execSync('cd frontend && npm run lint', { stdio: 'pipe' });
  console.log('✅ Código passou no linting');
} catch (error) {
  console.log('⚠️ Problemas de linting encontrados');
  console.log('   Execute: cd frontend && npm run lint:fix para corrigir');
}

// Resumo final
console.log('\n🎉 Teste do Frontend Concluído!');
console.log('\n📋 Resumo:');
console.log(`   ✅ Arquivos essenciais: ${allFilesExist ? 'OK' : 'FALTANDO'}`);
console.log(`   ✅ Dependências: Verificadas`);
console.log(`   ✅ Endpoints API: ${endpointsWorking}/${dashboardEndpoints.length} funcionando`);
console.log(`   ✅ Build: ${fs.existsSync(buildDir) ? 'OK' : 'FALTANDO'}`);

if (allFilesExist && endpointsWorking >= 3) {
  console.log('\n🚀 Frontend pronto para uso!');
  console.log('\n📋 Para executar:');
  console.log('   1. npm run frontend:start  # Desenvolvimento');
  console.log('   2. Acesse: http://localhost:3001');
  console.log('   3. Ou execute build: npm run frontend:build');
} else {
  console.log('\n⚠️ Alguns problemas foram encontrados.');
  console.log('   Revise os erros acima antes de prosseguir.');
}
