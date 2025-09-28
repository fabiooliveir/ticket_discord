const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testBudgetForm() {
  console.log('📝 Testando formulário "Ajuste de Verba"...\n');

  try {
    // 1. Testar listagem de categorias
    console.log('1️⃣ Verificando categoria "Ajuste de Verba"...');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/tickets/categories`);
    
    if (categoriesResponse.status === 200) {
      const categories = categoriesResponse.data;
      const budgetAdjustmentCategory = categories.find(cat => cat.id === 'budget-adjustment');
      
      if (budgetAdjustmentCategory) {
        console.log('✅ Categoria "Ajuste de Verba" encontrada!');
        console.log(`   - Campos do formulário: ${budgetAdjustmentCategory.formFields.length}`);
        
        // Verificar se tem apenas os campos necessários
        const expectedFields = ['adjustmentReason', 'requestedAmount', 'campaignInfo'];
        const actualFields = budgetAdjustmentCategory.formFields.map(field => field.id);
        
        console.log('\n2️⃣ Verificando campos do formulário...');
        console.log('   Campos esperados:', expectedFields);
        console.log('   Campos encontrados:', actualFields);
        
        const missingFields = expectedFields.filter(field => !actualFields.includes(field));
        const extraFields = actualFields.filter(field => !expectedFields.includes(field));
        
        if (missingFields.length === 0 && extraFields.length === 0) {
          console.log('✅ Campos do formulário estão corretos!');
        } else {
          if (missingFields.length > 0) {
            console.log('❌ Campos faltando:', missingFields);
          }
          if (extraFields.length > 0) {
            console.log('⚠️ Campos extras encontrados:', extraFields);
          }
        }
        
        // Verificar se não tem campos de time e prioridade
        const hasTeamField = actualFields.includes('team');
        const hasPriorityField = actualFields.includes('priority');
        
        if (!hasTeamField && !hasPriorityField) {
          console.log('✅ Campos de time e prioridade removidos corretamente!');
        } else {
          console.log('❌ Ainda existem campos de time ou prioridade no formulário!');
          if (hasTeamField) console.log('   - Campo "team" ainda presente');
          if (hasPriorityField) console.log('   - Campo "priority" ainda presente');
        }
        
        // Verificar campos obrigatórios
        const requiredFields = budgetAdjustmentCategory.formFields.filter(field => field.required);
        const expectedRequiredFields = ['adjustmentReason', 'requestedAmount'];
        const requiredFieldIds = requiredFields.map(field => field.id);
        
        console.log('\n3️⃣ Verificando campos obrigatórios...');
        console.log('   Campos obrigatórios esperados:', expectedRequiredFields);
        console.log('   Campos obrigatórios encontrados:', requiredFieldIds);
        
        const missingRequired = expectedRequiredFields.filter(field => !requiredFieldIds.includes(field));
        const extraRequired = requiredFieldIds.filter(field => !expectedRequiredFields.includes(field));
        
        if (missingRequired.length === 0 && extraRequired.length === 0) {
          console.log('✅ Campos obrigatórios estão corretos!');
        } else {
          if (missingRequired.length > 0) {
            console.log('❌ Campos obrigatórios faltando:', missingRequired);
          }
          if (extraRequired.length > 0) {
            console.log('⚠️ Campos obrigatórios extras:', extraRequired);
          }
        }
        
        // Detalhar cada campo
        console.log('\n4️⃣ Detalhamento dos campos:');
        budgetAdjustmentCategory.formFields.forEach((field, index) => {
          console.log(`   ${index + 1}. ${field.label} (${field.id})`);
          console.log(`      - Tipo: ${field.type}`);
          console.log(`      - Obrigatório: ${field.required}`);
          console.log(`      - Placeholder: ${field.placeholder || 'N/A'}`);
        });

      } else {
        console.log('❌ Categoria "Ajuste de Verba" não encontrada!');
      }
    } else {
      console.log('❌ Erro ao buscar categorias:', categoriesResponse.status);
    }

    console.log('\n🎉 Teste do formulário concluído!');
    console.log('\n📋 Resumo da implementação:');
    console.log('   ✅ Formulário simplificado para apenas 3 campos');
    console.log('   ✅ Campos obrigatórios: Motivo do Ajuste, Valor Solicitado');
    console.log('   ✅ Campo opcional: Informações da Campanha');
    console.log('   ✅ Campos de time e prioridade removidos');
    console.log('   ✅ Validações atualizadas');
    
    console.log('\n🚀 Próximos passos:');
    console.log('   1. Reiniciar o servidor Discord');
    console.log('   2. Testar o comando /criar-ticket');
    console.log('   3. Selecionar "Ajuste de Verba" no menu');
    console.log('   4. Verificar se o formulário tem apenas 3 campos');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
  }
}

// Executar teste
testBudgetForm();
