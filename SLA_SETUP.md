# 📊 Módulo SLA - Service Level Agreement

Este documento descreve a implementação do módulo de SLA (Service Level Agreement) no sistema de tickets Discord.

## 🎯 Objetivo

O módulo SLA permite monitorar e controlar o desempenho do atendimento através de métricas como tempo de resposta e tempo de resolução dos tickets.

## 🏗️ Arquitetura

### Entidades

#### Ticket (Expandida)
```typescript
// Novos campos adicionados:
firstResponseAt: Date;           // Data/hora da primeira resposta
resolvedAt: Date;               // Data/hora da resolução
closedAt: Date;                 // Data/hora do fechamento
responseTimeMinutes: number;    // Tempo de resposta em minutos
resolutionTimeMinutes: number;  // Tempo de resolução em minutos
slaCategory: string;           // Categoria SLA (business_hours, after_hours, etc.)
```

#### SlaConfig (Nova)
```typescript
name: string;                    // Nome da configuração
category: string;               // Categoria (business_hours, after_hours)
priority: string;               // Prioridade (critical, high, medium, low)
responseTimeTarget: number;     // Target de resposta em minutos
resolutionTimeTarget: number;   // Target de resolução em minutos
isActive: boolean;             // Se a configuração está ativa
description: string;           // Descrição da configuração
metadata: Record<string, any>; // Dados adicionais
```

### Configurações Padrão de SLA

| Prioridade | Categoria | Tempo Resposta | Tempo Resolução |
|------------|-----------|----------------|-----------------|
| Crítico    | Business Hours | 15 min | 2 horas |
| Crítico    | After Hours | 1 hora | 8 horas |
| Alta       | Business Hours | 30 min | 4 horas |
| Alta       | After Hours | 4 horas | 16 horas |
| Média      | Business Hours | 2 horas | 24 horas |
| Média      | After Hours | 8 horas | 48 horas |
| Baixa      | Business Hours | 8 horas | 72 horas |
| Baixa      | After Hours | 24 horas | 144 horas |

## 📡 API Endpoints

### Métricas de SLA

#### `GET /sla/metrics`
Retorna métricas gerais de SLA para todos os tickets fechados.

**Resposta:**
```json
{
  "totalTickets": 150,
  "compliantTickets": 120,
  "atRiskTickets": 20,
  "breachedTickets": 10,
  "complianceRate": 80,
  "averageResponseTime": 45,
  "averageResolutionTime": 180,
  "metricsByPriority": {
    "high": {
      "total": 50,
      "compliant": 40,
      "atRisk": 8,
      "breached": 2,
      "complianceRate": 80,
      "avgResponseTime": 25,
      "avgResolutionTime": 120
    }
  }
}
```

#### `GET /sla/metrics/period?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Retorna métricas de SLA para um período específico.

#### `GET /sla/metrics/ticket/:id`
Retorna métricas de SLA para um ticket específico.

#### `POST /sla/metrics/ticket/:id/update`
Atualiza as métricas de SLA de um ticket específico.

### Configurações de SLA

#### `GET /sla/configs`
Lista todas as configurações de SLA ativas.

#### `GET /sla/configs/:category/:priority`
Busca configuração específica por categoria e prioridade.

#### `POST /sla/configs`
Cria nova configuração de SLA.

**Body:**
```json
{
  "name": "Configuração Personalizada",
  "category": "business_hours",
  "priority": "high",
  "responseTimeTarget": 30,
  "resolutionTimeTarget": 240,
  "description": "Configuração para tickets de alta prioridade"
}
```

### Status em Tempo Real

#### `GET /sla/status`
Retorna status atual de SLA para monitoramento em tempo real.

## 🔧 Instalação e Configuração

### 1. Executar Migrações
```bash
npm run setup:sla
```

### 2. Verificar Configurações
```bash
# Listar configurações criadas
curl http://localhost:3000/sla/configs
```

### 3. Testar Métricas
```bash
# Verificar métricas gerais
curl http://localhost:3000/sla/metrics

# Verificar status atual
curl http://localhost:3000/sla/status
```

## 📊 Métricas e Status

### Status de SLA
- **COMPLIANT**: Dentro do tempo target
- **AT_RISK**: Próximo ao limite (80% do target)
- **BREACHED**: Acima do tempo target
- **NOT_APPLICABLE**: Sem dados suficientes

### Cálculos Automáticos
- **Tempo de Resposta**: Diferença entre criação do ticket e primeira resposta
- **Tempo de Resolução**: Diferença entre criação do ticket e resolução
- **Taxa de Compliance**: Percentual de tickets dentro do SLA

## 🚀 Integração com Tickets

O módulo SLA se integra automaticamente com o sistema de tickets:

1. **Criação de Ticket**: Aplica configuração de SLA baseada na prioridade
2. **Primeira Resposta**: Calcula tempo de resposta automaticamente
3. **Resolução**: Calcula tempo de resolução automaticamente
4. **Fechamento**: Finaliza métricas de SLA

## 🔍 Monitoramento

### Alertas Automáticos
- Tickets próximos ao limite de SLA
- Tickets que ultrapassaram o SLA
- Tendências de degradação de performance

### Relatórios
- Compliance por prioridade
- Performance por agente/equipe
- Tendências temporais
- Comparativos históricos

## 🛠️ Desenvolvimento

### Estrutura de Arquivos
```
src/
├── modules/sla/
│   ├── sla.module.ts
│   ├── sla.service.ts
│   └── sla.controller.ts
├── shared/
│   ├── enums/
│   │   ├── sla-targets.enum.ts
│   │   └── sla-categories.enum.ts
│   ├── dto/
│   │   └── sla-metrics.dto.ts
│   └── utils/
│       └── sla-calculator.util.ts
└── database/
    ├── entities/
    │   └── sla-config.entity.ts
    └── migrations/
        ├── AddSlaFieldsToTickets.ts
        └── CreateSlaConfigsTable.ts
```

### Próximas Funcionalidades
- [ ] Dashboard web para visualização
- [ ] Notificações automáticas
- [ ] Relatórios exportáveis
- [ ] Métricas por agente/equipe
- [ ] Integração com horário comercial
- [ ] Alertas via Discord

## 📝 Exemplos de Uso

### Verificar Compliance Geral
```bash
curl http://localhost:3000/sla/metrics | jq '.complianceRate'
```

### Monitorar Tickets em Risco
```bash
curl http://localhost:3000/sla/status | jq '.overall.atRiskTickets'
```

### Criar Configuração Personalizada
```bash
curl -X POST http://localhost:3000/sla/configs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VIP Clientes",
    "category": "business_hours",
    "priority": "critical",
    "responseTimeTarget": 10,
    "resolutionTimeTarget": 60,
    "description": "SLA para clientes VIP"
  }'
```

---

**Nota**: Este módulo está na Fase 1 de implementação. Funcionalidades avançadas como dashboard web e notificações automáticas serão implementadas nas próximas fases.
