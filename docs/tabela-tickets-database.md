# 📊 Documentação da Tabela `tickets` - Database Schema

Esta documentação descreve a estrutura completa da tabela `tickets` no banco de dados para desenvolvimento do dashboard.

## 🗂️ Estrutura da Tabela

### Nome da Tabela
```sql
tickets
```

### Índices
- `IDX_TICKET_STATUS` - Índice em `status`
- `IDX_TICKET_DISCORD_USER` - Índice em `discordUserId`
- `IDX_TICKET_CREATED_AT` - Índice em `createdAt`

---

## 📋 Colunas da Tabela

### 🔑 Chave Primária
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `varchar(36)` | **Chave primária** - UUID gerado automaticamente |

### 📝 Informações Básicas do Ticket
| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `title` | `varchar(255)` | ❌ | - | **Título do ticket** - Resumo da demanda |
| `description` | `text` | ✅ | `NULL` | **Descrição detalhada** - Detalhes completos da demanda |

### 🏷️ Categorização e Classificação
| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `status` | `varchar(50)` | ❌ | `'open'` | **Status atual do ticket** |
| `priority` | `varchar(100)` | ❌ | `'medium'` | **Prioridade do ticket** |
| `type` | `enum` | ❌ | `'leadfy'` | **Tipo de ticket** |
| `categoryId` | `varchar(100)` | ✅ | `NULL` | **ID da categoria** |
| `website` | `varchar(500)` | ✅ | `NULL` | **URL do site** (para tickets de tagueamento) |

### 👥 Usuários e Atribuição
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `discordUserId` | `varchar(255)` | ❌ | **ID do usuário Discord** que criou o ticket |
| `discordChannelId` | `varchar(255)` | ✅ | **ID do canal/thread Discord** associado |
| `assignedTo` | `varchar(255)` | ✅ | **ID do usuário Discord** responsável pelo ticket |
| `clientId` | `varchar(255)` | ✅ | **ID do cliente** na Leadfy |

### 📊 Dados Estruturados
| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `metadata` | `json` | ✅ | **Dados adicionais** - Informações específicas do ticket |
| `categoryData` | `json` | ✅ | **Dados da categoria** - Informações específicas da categoria |
| `messages` | `json` | ✅ | **Histórico de mensagens** - Mensagens capturadas ao arquivar o ticket |

### ⏰ Controle de Tempo (BaseEntity)
| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `createdAt` | `timestamp` | ❌ | `CURRENT_TIMESTAMP(6)` | **Data de criação** |
| `updatedAt` | `timestamp` | ❌ | `CURRENT_TIMESTAMP(6)` | **Data da última atualização** |
| `deletedAt` | `timestamp` | ✅ | `NULL` | **Data de exclusão** (soft delete) |

### 🎯 SLA - Service Level Agreement
| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `firstResponseAt` | `timestamp` | ✅ | `NULL` | **Data da primeira resposta** |
| `firstResponseCaptured` | `boolean` | ❌ | `false` | **Primeira resposta foi capturada** |
| `resolvedAt` | `timestamp` | ✅ | `NULL` | **Data de resolução** |
| `closedAt` | `timestamp` | ✅ | `NULL` | **Data de fechamento** |
| `responseTimeMinutes` | `int` | ✅ | `NULL` | **Tempo de resposta em minutos** |
| `resolutionTimeMinutes` | `int` | ✅ | `NULL` | **Tempo de resolução em minutos** |
| `durationTimeMinutes` | `int` | ✅ | `NULL` | **Duração total em minutos** |
| `durationSlaStatus` | `varchar(50)` | ✅ | `NULL` | **Status do SLA de duração** |
| `slaCategory` | `varchar(50)` | ❌ | `'business_hours'` | **Categoria do SLA** |

---

## 🔄 Valores Possíveis

### Status (`status`)
```sql
-- Valores encontrados no código:
'open'          -- Ticket aberto (padrão)
'assigned'      -- Ticket atribuído
'pause'         -- Ticket pausado
'waiting_client'-- Aguardando cliente
'closed'        -- Ticket fechado
'resolved'      -- Ticket resolvido
'in_progress'   -- Em andamento
'pending'       -- Pendente
```

### Prioridade (`priority`)
```sql
-- Valores possíveis:
'high'          -- Alta prioridade (🔴)
'medium'        -- Média prioridade (🟡) - Padrão
'low'           -- Baixa prioridade (🟢)
```

### Tipo (`type`)
```sql
-- Enum TaskType:
'leadfy'        -- Ticket Leadfy (padrão)
'c7_auto'       -- Ticket C7 Auto
```

### Categorias (`categoryId`)
```sql
-- Categorias disponíveis:
'correction-tagging'    -- Correção de Tagueamento
'new-tagging'           -- Novo Tagueamento
'budget-adjustment'     -- Ajuste de Verba
'general'               -- Geral
'c7-auto'               -- C7 Auto
```

### SLA Status (`durationSlaStatus`)
```sql
-- Status possíveis do SLA:
'compliant'     -- Dentro do SLA
'at_risk'       -- Em risco
'breached'      -- Violado
```

---

## 📊 Estrutura do Campo `metadata`

O campo `metadata` é um JSON que pode conter:

```json
{
  "clientName": "Nome do Cliente",
  "category": "Nome da Categoria",
  "createdVia": "c7_auto_command | discord_form | etc",
  "authorTag": "usuario#1234",
  "assignedTeam": "suporte | cs | trafego",
  "formData": {
    "title": "Título do formulário",
    "description": "Descrição do formulário",
    "website": "https://exemplo.com",
    "problemDescription": "Descrição do problema",
    "additionalInfo": "Informações adicionais",
    "metaAccountId": "123456789",
    "googleAdsAccountId": "123-456-7890",
    "facebookPixelId": "123456789012345",
    "adjustmentReason": "Motivo do ajuste",
    "requestedAmount": "R$ 1.500,00",
    "campaignInfo": "Informações da campanha"
  },
  "threadId": "1234567890123456789",
  "threadUrl": "https://discord.com/channels/...",
  "createdBy": "Discord User"
}
```

---

## 📊 Estrutura do Campo `categoryData`

O campo `categoryData` é um JSON que pode conter:

```json
{
  "categoryId": "correction-tagging",
  "clientId": "cliente_123",
  "clientName": "Nome do Cliente",
  "team": "suporte",
  "priority": "medium",
  "website": "https://exemplo.com",
  "formFields": [
    {
      "id": "website",
      "label": "Site que precisa de correção",
      "value": "https://exemplo.com"
    }
  ]
}
```

## 📊 Estrutura do Campo `messages`

O campo `messages` é um JSON que contém o histórico de mensagens capturadas ao arquivar o ticket:

```json
[
  {
    "id": "1234567890123456789",
    "author": {
      "id": "9876543210987654321",
      "username": "usuario123",
      "tag": "usuario123#1234"
    },
    "content": "Olá, preciso de ajuda com meu site",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "attachments": [
      {
        "id": "attachment_id",
        "filename": "screenshot.png",
        "url": "https://cdn.discordapp.com/...",
        "size": 1024000
      }
    ],
    "type": "user"
  },
  {
    "id": "1234567890123456790",
    "author": {
      "id": "1111111111111111111",
      "username": "agente_suporte",
      "tag": "agente_suporte#5678"
    },
    "content": "Claro! Vou te ajudar com isso",
    "timestamp": "2024-01-15T10:35:00.000Z",
    "attachments": [],
    "type": "user"
  }
]
```

### Campos das Mensagens:
- **id**: ID único da mensagem no Discord
- **author.id**: ID do usuário Discord
- **author.username**: Nome do usuário
- **author.tag**: Tag completa (username#discriminator)
- **content**: Conteúdo da mensagem
- **timestamp**: Data/hora em ISO string
- **attachments**: Array de anexos (se houver)
- **type**: Tipo da mensagem (`user` ou `system`)

---

## 🔍 Queries Úteis para Dashboard

### Tickets por Status
```sql
SELECT status, COUNT(*) as total 
FROM tickets 
WHERE deletedAt IS NULL 
GROUP BY status;
```

### Tickets por Prioridade
```sql
SELECT priority, COUNT(*) as total 
FROM tickets 
WHERE deletedAt IS NULL 
GROUP BY priority;
```

### Tickets por Tipo
```sql
SELECT type, COUNT(*) as total 
FROM tickets 
WHERE deletedAt IS NULL 
GROUP BY type;
```

### Tickets por Categoria
```sql
SELECT categoryId, COUNT(*) as total 
FROM tickets 
WHERE deletedAt IS NULL 
GROUP BY categoryId;
```

### Performance de SLA
```sql
SELECT 
  durationSlaStatus,
  COUNT(*) as total,
  AVG(durationTimeMinutes) as avg_duration_minutes
FROM tickets 
WHERE deletedAt IS NULL 
  AND durationTimeMinutes IS NOT NULL
GROUP BY durationSlaStatus;
```

### Tickets Criados por Período
```sql
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as total
FROM tickets 
WHERE deletedAt IS NULL 
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(createdAt)
ORDER BY date DESC;
```

### Tempo Médio de Resposta por Prioridade
```sql
SELECT 
  priority,
  AVG(responseTimeMinutes) as avg_response_minutes,
  COUNT(*) as total_tickets
FROM tickets 
WHERE deletedAt IS NULL 
  AND responseTimeMinutes IS NOT NULL
GROUP BY priority;
```

### Tickets com Mensagens Capturadas
```sql
SELECT 
  id,
  title,
  status,
  JSON_LENGTH(messages) as message_count,
  metadata->>'messagesCount' as metadata_message_count
FROM tickets 
WHERE deletedAt IS NULL 
  AND messages IS NOT NULL 
  AND JSON_LENGTH(messages) > 0
ORDER BY createdAt DESC;
```

### Análise de Mensagens por Ticket
```sql
SELECT 
  t.id,
  t.title,
  t.status,
  JSON_LENGTH(t.messages) as total_messages,
  COUNT(CASE WHEN JSON_EXTRACT(msg.value, '$.type') = 'user' THEN 1 END) as user_messages,
  COUNT(CASE WHEN JSON_EXTRACT(msg.value, '$.type') = 'system' THEN 1 END) as system_messages
FROM tickets t,
  JSON_TABLE(t.messages, '$[*]' COLUMNS (
    value JSON PATH '$'
  )) as msg
WHERE t.deletedAt IS NULL 
  AND t.messages IS NOT NULL
GROUP BY t.id, t.title, t.status
ORDER BY total_messages DESC;
```

---

## 📈 Métricas Recomendadas para Dashboard

### 📊 KPIs Principais
- **Total de Tickets**: Contagem geral
- **Taxa de Resolução**: Tickets resolvidos / Total
- **Tempo Médio de Resposta**: Por prioridade
- **Tempo Médio de Resolução**: Por categoria
- **Compliance SLA**: % dentro do prazo

### 📅 Análises Temporais
- **Tickets por Dia/Semana/Mês**
- **Tendência de Criação vs Resolução**
- **Sazonalidade**

### 👥 Análises de Equipe
- **Tickets por Agente**
- **Performance por Equipe**
- **Distribuição de Carga**

### 🏷️ Análises por Categoria
- **Volume por Tipo de Ticket**
- **Tempo de Resolução por Categoria**
- **Priorização**

---

## ⚠️ Observações Importantes

1. **Soft Delete**: A tabela usa soft delete (`deletedAt`), sempre filtrar por `deletedAt IS NULL`
2. **Timezone**: Todos os timestamps estão em UTC
3. **JSON Fields**: `metadata` e `categoryData` são campos JSON flexíveis
4. **SLA**: Campos de SLA são calculados dinamicamente
5. **Discord IDs**: Todos os IDs do Discord são strings
6. **Business Hours**: SLA considera apenas horário comercial por padrão

---

## 🚀 Próximos Passos para Dashboard

1. **Criar views materializadas** para queries complexas
2. **Implementar cache** para métricas frequentes
3. **Configurar alertas** baseados em SLA
4. **Adicionar filtros** por período, equipe, categoria
5. **Implementar drill-down** para análise detalhada
