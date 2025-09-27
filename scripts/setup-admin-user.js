const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Usuário admin padrão
const adminUser = {
  username: 'admin',
  email: 'admin@ticketdiscord.com',
  password: 'admin123',
  role: 'admin'
};

async function setupAdminUser() {
  console.log('👤 Configurando usuário administrador...\n');

  try {
    // Verificar se o servidor está rodando
    console.log('1️⃣ Verificando se o servidor está rodando...');
    try {
      await axios.get(`${BASE_URL}/`);
      console.log('✅ Servidor está rodando!');
    } catch (error) {
      console.log('❌ Servidor não está rodando. Execute: npm run start:dev');
      return;
    }

    // Tentar criar usuário admin
    console.log('\n2️⃣ Criando usuário administrador...');
    try {
      const response = await axios.post(`${BASE_URL}/users/setup-admin`, adminUser);
      console.log('✅ Usuário administrador criado com sucesso!');
      console.log('📧 Email:', adminUser.email);
      console.log('👤 Username:', adminUser.username);
      console.log('🔑 Senha:', adminUser.password);
      console.log('⚠️ IMPORTANTE: Altere a senha após o primeiro login!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('⚠️ Sistema já foi inicializado! Tentando fazer login...');
        
        // Tentar fazer login para verificar se está funcionando
        console.log('\n3️⃣ Testando login do administrador...');
        try {
          const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: adminUser.username,
            password: adminUser.password
          });
          console.log('✅ Login do administrador funcionando!');
          console.log('Token gerado:', loginResponse.data.access_token ? 'Sim' : 'Não');
        } catch (loginError) {
          console.log('❌ Erro no login do administrador:', loginError.response?.data || loginError.message);
        }
      } else {
        console.log('❌ Erro ao criar usuário administrador:', error.response?.data || error.message);
      }
    }

    console.log('\n📋 Informações de acesso:');
    console.log('URL: http://localhost:3000');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin (acesso total)');

    console.log('\n🔐 Endpoints de autenticação:');
    console.log('POST /auth/login - Fazer login');
    console.log('POST /auth/refresh - Renovar token');
    console.log('GET /auth/profile - Ver perfil');
    console.log('POST /auth/logout - Fazer logout');

    console.log('\n🛡️ Dashboard protegido:');
    console.log('GET /dashboard/overview - Visão geral (requer autenticação)');
    console.log('GET /dashboard/metrics - Métricas (requer autenticação)');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Executar setup
setupAdminUser();
