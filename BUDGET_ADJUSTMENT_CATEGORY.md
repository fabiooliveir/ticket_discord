# 💰 Categoria "Ajuste de Verba" - Documentação

## 📋 Visão Geral

A categoria **"Ajuste de Verba"** foi implementada para gerenciar solicitações de ajustes de verba em campanhas de marketing digital. Esta categoria permite que usuários solicitem aumentos, reduções ou realocações de verba de forma estruturada.

## 🎯 Características

- **ID da Categoria**: `budget-adjustment`
- **Nome**: Ajuste de Verba
- **Time Responsável**: Tráfego Pago (padrão)
- **Prioridade Padrão**: Média
- **Requer Cliente**: Sim (obrigatório)

## 📝 Campos do Formulário

### Campos Obrigatórios

1. **Motivo do Ajuste** (`adjustmentReason`)
   - **Tipo**: Textarea
   - **Validação**: 10-1000 caracteres
   - **Descrição**: Explicação detalhada do motivo do ajuste

2. **Valor Solicitado** (`requestedAmount`)
   - **Tipo**: Text
   - **Validação**: Formato flexível (R$ X,XX, X%, X reais)
   - **Exemplos**: "R$ 1.500,00", "15%", "1500 reais"

### Campos Opcionais

3. **Informações da Campanha** (`campaignInfo`)
   - **Tipo**: Textarea
   - **Validação**: Máximo 500 caracteres
   - **Descrição**: ID da campanha, período, plataforma, etc.

### Campos de Configuração

4. **Time Responsável** (`team`)
   - **Tipo**: Select
   - **Opções**: Tráfego Pago, Customer Success
   - **Padrão**: Tráfego Pago

5. **Prioridade** (`priority`)
   - **Tipo**: Select
   - **Opções**: 🔴 Alta, 🟡 Média, 🟢 Baixa
   - **Padrão**: Média

## 🏗️ Arquitetura Implementada

### Estrutura de Arquivos

```
src/modules/tickets/categories/budget-adjustment/
├── budget-adjustment.interface.ts    # Interfaces TypeScript
├── budget-adjustment.service.ts      # Lógica de negócio
└── budget-adjustment.form.ts         # Formulários Discord
```

### Serviços Criados

- **`BudgetAdjustmentService`**: Gerencia validações e operações específicas
- **`BudgetAdjustmentForm`**: Cria formulários Discord interativos
- **Interfaces**: `BudgetAdjustmentData` e `BudgetAdjustmentFormData`

### Integração com Sistema Existente

- ✅ **TicketCategoryService**: Categoria adicionada ao sistema
- ✅ **TicketsModule**: Serviço registrado no módulo
- ✅ **TicketsController**: Endpoint `/tickets/categories` disponível
- ✅ **Validação**: Campos obrigatórios implementados
- ✅ **Descrição**: Formatação automática para tickets

## 🔧 Validações Implementadas

### Motivo do Ajuste
- Campo obrigatório
- Mínimo 10 caracteres
- Máximo 1000 caracteres

### Valor Solicitado
- Campo obrigatório
- Formato flexível aceito:
  - `R$ 1.500,00`
  - `15%`
  - `1500 reais`
  - `R$1500`

### Time Responsável
- Apenas "trafico" ou "cs" aceitos
- Validação de valores permitidos

## 📊 Exemplo de Dados

### Dados de Entrada (Formulário)
```json
{
  "adjustmentReason": "Aumento de tráfego orgânico requer mais verba para conversão",
  "requestedAmount": "R$ 2.500,00",
  "campaignInfo": "Campanha Black Friday - Meta Ads - ID: 123456",
  "team": "trafico",
  "priority": "high"
}
```

### Dados Salvos no Ticket
```json
{
  "categoryId": "budget-adjustment",
  "clientId": "client-123",
  "clientName": "Cliente Exemplo",
  "team": "trafico",
  "priority": "high",
  "adjustmentReason": "Aumento de tráfego orgânico requer mais verba para conversão",
  "requestedAmount": "R$ 2.500,00",
  "campaignInfo": "Campanha Black Friday - Meta Ads - ID: 123456"
}
```

### Descrição Formatada do Ticket
```
**Cliente:** Cliente Exemplo
**Motivo do Ajuste:** Aumento de tráfego orgânico requer mais verba para conversão
**Valor Solicitado:** R$ 2.500,00
**Informações da Campanha:** Campanha Black Friday - Meta Ads - ID: 123456
**Time responsável:** trafico
**Prioridade:** high
```

## 🧪 Testes

### Script de Teste
```bash
npm run test:budget-adjustment
```

### Endpoints Disponíveis
- `GET /tickets/categories` - Lista todas as categorias
- `POST /tickets` - Cria ticket (suporta nova categoria)

## 🚀 Como Usar

1. **Via API**: Chame o endpoint `/tickets/categories` para ver a nova categoria
2. **Via Discord**: A categoria aparecerá automaticamente nos formulários
3. **Validação**: O sistema validará automaticamente os campos obrigatórios

## 🔄 Próximos Passos

1. **Frontend**: Atualizar interface para incluir nova categoria
2. **Discord**: Integrar formulários com bot do Discord
3. **SLA**: Configurar SLA específico para ajustes de verba
4. **Notificações**: Configurar alertas para time responsável

## 📈 Benefícios

- ✅ **Estruturação**: Solicitações organizadas e padronizadas
- ✅ **Rastreabilidade**: Histórico completo de ajustes solicitados
- ✅ **Validação**: Campos obrigatórios garantem informações completas
- ✅ **Flexibilidade**: Formato de valor aceita diferentes estilos
- ✅ **Integração**: Funciona com sistema existente sem modificações

---

**Implementado em**: Dezembro 2024  
**Versão**: 1.0.0  
**Status**: ✅ Ativo e Funcional
