const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando Problemas no Sistema de Autenticação...\n');

// Verificar se os arquivos existem
const filesToCheck = [
  'src/modules/users/entities/user.entity.ts',
  'src/modules/users/users.service.ts',
  'src/modules/users/users.controller.ts',
  'src/modules/users/users.module.ts',
  'src/modules/auth/auth.service.ts',
  'src/modules/auth/auth.controller.ts',
  'src/modules/auth/auth.module.ts',
  'src/modules/auth/strategies/jwt.strategy.ts',
  'src/modules/auth/strategies/local.strategy.ts',
  'src/modules/auth/guards/jwt-auth.guard.ts',
  'src/modules/auth/guards/roles.guard.ts',
  'src/modules/auth/decorators/roles.decorator.ts',
  'src/modules/auth/decorators/auth.decorator.ts',
  'src/database/migrations/1700000000000-CreateUsersTable.ts'
];

let issuesFound = 0;

console.log('1️⃣ Verificando arquivos...');
filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - ARQUIVO NÃO ENCONTRADO`);
    issuesFound++;
  }
});

// Verificar package.json
console.log('\n2️⃣ Verificando dependências no package.json...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = [
    '@nestjs/jwt',
    '@nestjs/passport',
    'passport',
    'passport-jwt',
    'passport-local',
    'bcrypt'
  ];
  
  const requiredDevDeps = [
    '@types/bcrypt',
    '@types/passport-jwt',
    '@types/passport-local'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} (dependencies)`);
    } else {
      console.log(`❌ ${dep} - FALTANDO em dependencies`);
      issuesFound++;
    }
  });
  
  requiredDevDeps.forEach(dep => {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep} (devDependencies)`);
    } else {
      console.log(`❌ ${dep} - FALTANDO em devDependencies`);
      issuesFound++;
    }
  });
} else {
  console.log('❌ package.json não encontrado');
  issuesFound++;
}

// Verificar env.example
console.log('\n3️⃣ Verificando configurações de ambiente...');
const envExamplePath = path.join(__dirname, '..', 'env.example');
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRES_IN'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar}`);
    } else {
      console.log(`❌ ${envVar} - FALTANDO em env.example`);
      issuesFound++;
    }
  });
} else {
  console.log('❌ env.example não encontrado');
  issuesFound++;
}

// Verificar app.module.ts
console.log('\n4️⃣ Verificando integração no AppModule...');
const appModulePath = path.join(__dirname, '..', 'src', 'app.module.ts');
if (fs.existsSync(appModulePath)) {
  const appModuleContent = fs.readFileSync(appModulePath, 'utf8');
  
  if (appModuleContent.includes('UsersModule') && appModuleContent.includes('AuthModule')) {
    console.log('✅ UsersModule e AuthModule importados no AppModule');
  } else {
    console.log('❌ UsersModule ou AuthModule não importados no AppModule');
    issuesFound++;
  }
} else {
  console.log('❌ app.module.ts não encontrado');
  issuesFound++;
}

// Verificar dashboard controller
console.log('\n5️⃣ Verificando proteção do dashboard...');
const dashboardControllerPath = path.join(__dirname, '..', 'src', 'modules', 'dashboard', 'dashboard.controller.ts');
if (fs.existsSync(dashboardControllerPath)) {
  const dashboardContent = fs.readFileSync(dashboardControllerPath, 'utf8');
  
  if (dashboardContent.includes('@UseGuards(JwtAuthGuard, RolesGuard)')) {
    console.log('✅ Dashboard controller protegido com guards');
  } else {
    console.log('❌ Dashboard controller não protegido com guards');
    issuesFound++;
  }
  
  const roleDecorators = (dashboardContent.match(/@Roles/g) || []).length;
  console.log(`✅ ${roleDecorators} endpoints com proteção por roles`);
} else {
  console.log('❌ dashboard.controller.ts não encontrado');
  issuesFound++;
}

// Resumo
console.log('\n📊 RESUMO DA VERIFICAÇÃO:');
if (issuesFound === 0) {
  console.log('🎉 NENHUM PROBLEMA ENCONTRADO! Sistema de autenticação está pronto.');
} else {
  console.log(`⚠️ ${issuesFound} PROBLEMAS ENCONTRADOS que precisam ser corrigidos.`);
}

console.log('\n🔧 PRÓXIMOS PASSOS:');
console.log('1. Execute: npm install');
console.log('2. Execute: npm run migration:run');
console.log('3. Execute: npm run setup:admin');
console.log('4. Execute: npm run test:auth');
console.log('5. Execute: npm run start:dev');
