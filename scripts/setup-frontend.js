#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Frontend Dashboard...\n');

// Verificar se Node.js está instalado
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js ${nodeVersion} encontrado`);
} catch (error) {
  console.error('❌ Node.js não encontrado. Instale Node.js 18+ para continuar.');
  process.exit(1);
}

// Verificar se npm está instalado
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm ${npmVersion} encontrado`);
} catch (error) {
  console.error('❌ npm não encontrado. Instale npm para continuar.');
  process.exit(1);
}

// Navegar para o diretório frontend
const frontendDir = path.join(__dirname, '..', 'frontend');

if (!fs.existsSync(frontendDir)) {
  console.error('❌ Diretório frontend não encontrado.');
  process.exit(1);
}

process.chdir(frontendDir);
console.log(`📁 Trabalhando em: ${frontendDir}`);

// Instalar dependências
console.log('\n📦 Instalando dependências...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas com sucesso');
} catch (error) {
  console.error('❌ Erro ao instalar dependências:', error.message);
  process.exit(1);
}

// Criar arquivo .env se não existir
const envFile = path.join(frontendDir, '.env');
if (!fs.existsSync(envFile)) {
  console.log('\n⚙️ Criando arquivo .env...');
  const envContent = `# API Configuration
REACT_APP_API_URL=http://localhost:3000

# Environment
REACT_APP_ENV=development

# Debug mode
REACT_APP_DEBUG=false
`;
  
  fs.writeFileSync(envFile, envContent);
  console.log('✅ Arquivo .env criado');
} else {
  console.log('✅ Arquivo .env já existe');
}

// Verificar se a API está rodando
console.log('\n🔍 Verificando API...');
try {
  const response = execSync('curl -s http://localhost:3000/health', { encoding: 'utf8' });
  if (response.includes('OK') || response.includes('healthy')) {
    console.log('✅ API está rodando na porta 3000');
  } else {
    console.log('⚠️ API não está respondendo corretamente');
  }
} catch (error) {
  console.log('⚠️ API não está rodando. Execute o backend primeiro.');
  console.log('   Comando: npm run start:dev');
}

// Build de verificação
console.log('\n🔨 Verificando build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build de produção bem-sucedido');
} catch (error) {
  console.error('❌ Erro no build:', error.message);
  console.log('⚠️ Verifique os erros de compilação acima');
}

console.log('\n🎉 Frontend configurado com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('   1. Certifique-se de que a API está rodando (npm run start:dev)');
console.log('   2. Execute o frontend: npm start');
console.log('   3. Acesse: http://localhost:3001');
console.log('\n🔧 Comandos úteis:');
console.log('   npm start          # Desenvolvimento');
console.log('   npm run build      # Build de produção');
console.log('   npm test           # Executar testes');
console.log('   npm run lint       # Verificar código');
