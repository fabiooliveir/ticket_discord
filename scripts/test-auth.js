const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Dados de teste
const testUser = {
  username: 'admin',
  email: 'admin@ticketdiscord.com',
  password: 'admin123',
  role: 'admin'
};

const testCredentials = {
  username: 'admin',
  password: 'admin123'
};

// Configurar timeout para axios
axios.defaults.timeout = 10000;

async function testAuth() {
  console.log('🔐 Testando Sistema de Autenticação...\n');

  try {
    // 1. Testar criação de usuário
    console.log('1️⃣ Testando criação de usuário...');
    try {
      const createResponse = await axios.post(`${BASE_URL}/users`, testUser);
      console.log('✅ Usuário criado com sucesso:', createResponse.data);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️ Usuário já existe, continuando...');
      } else {
        console.log('❌ Erro ao criar usuário:', error.response?.data || error.message);
      }
    }

    // 2. Testar login
    console.log('\n2️⃣ Testando login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testCredentials);
    console.log('✅ Login realizado com sucesso!');
    console.log('Token:', loginResponse.data.access_token.substring(0, 50) + '...');
    
    const token = loginResponse.data.access_token;

    // 3. Testar acesso ao perfil
    console.log('\n3️⃣ Testando acesso ao perfil...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Perfil acessado:', profileResponse.data);

    // 4. Testar acesso ao dashboard (protegido)
    console.log('\n4️⃣ Testando acesso ao dashboard...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Dashboard acessado com sucesso!');
      console.log('Dados do dashboard:', Object.keys(dashboardResponse.data));
    } catch (error) {
      console.log('❌ Erro ao acessar dashboard:', error.response?.data || error.message);
    }

    // 5. Testar acesso sem token (deve falhar)
    console.log('\n5️⃣ Testando acesso sem token (deve falhar)...');
    try {
      await axios.get(`${BASE_URL}/dashboard/overview`);
      console.log('❌ ERRO: Dashboard deveria estar protegido!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Dashboard corretamente protegido!');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data || error.message);
      }
    }

    // 6. Testar refresh token
    console.log('\n6️⃣ Testando refresh token...');
    try {
      const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: loginResponse.data.refresh_token
      });
      console.log('✅ Refresh token funcionando!');
      console.log('Novo token:', refreshResponse.data.access_token.substring(0, 50) + '...');
    } catch (error) {
      console.log('❌ Erro no refresh token:', error.response?.data || error.message);
    }

    // 7. Testar logout
    console.log('\n7️⃣ Testando logout...');
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Logout realizado:', logoutResponse.data);
    } catch (error) {
      console.log('❌ Erro no logout:', error.response?.data || error.message);
    }

    console.log('\n🎉 Testes de autenticação concluídos!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Executar testes
testAuth();
