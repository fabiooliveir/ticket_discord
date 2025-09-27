# 🏢 Sistema de Equipes - Configuração e Uso

## 📋 Visão Geral

O sistema de equipes permite que tickets sejam automaticamente direcionados para as equipes corretas baseado no conteúdo do ticket. Cada equipe tem seu próprio canal e cargo no Discord.

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# CONFIGURAÇÕES ESPECÍFICAS DAS EQUIPES
# ========================================
# IDs dos canais das equipes (opcionais - têm valores padrão)
SUPORTE_CHANNEL_ID=1405162714581438524
CS_CHANNEL_ID=1405162746122866798
TRAFEGO_CHANNEL_ID=1405162779299549234

# IDs dos cargos das equipes (opcionais - têm valores padrão)
SUPORTE_ROLE_ID=1405155398247252008
CS_ROLE_ID=1405155496704475187
TRAFEGO_ROLE_ID=1405155577134579742
```

### 2. Equipes Configuradas

| Equipe | Canal ID | Cargo ID | Palavras-chave | Emoji | Cor |
|--------|----------|----------|----------------|-------|-----|
| **Suporte Técnico** | SUPORTE_CHANNEL_ID | SUPORTE_ROLE_ID | suporte, problema, bug, erro, ajuda, dúvida, ticket | 🔧 | Vermelho |
| **Customer Success** | CS_CHANNEL_ID | CS_ROLE_ID | cs, atendimento, cliente, vendas, comercial, proposta | 💼 | Turquesa |
| **Tráfego Pago** | TRAFEGO_CHANNEL_ID | TRAFEGO_ROLE_ID | tráfego, marketing, campanha, anúncio, lead, conversão | 📈 | Azul |

## 🚀 Como Usar

### Comandos Disponíveis

#### 1. Criar Ticket
```
!ticket create <título>
```
- O sistema analisa o título e direciona automaticamente para a equipe correta
- A equipe é notificada no canal específico
- O cargo da equipe é mencionado

#### 2. Ver Informações das Equipes
```
!ticket teams
```
- Mostra todos os canais e cargos configurados
- Exibe palavras-chave de cada equipe

#### 3. Ver Estatísticas das Equipes
```
!ticket stats
```
- Mostra número de membros em cada cargo
- Exibe nomes dos canais

#### 4. Outros Comandos
```
!ticket list    # Lista seus tickets
!ticket close   # Fecha seu ticket
!ticket help    # Mostra ajuda completa
```

## 🔄 Fluxo de Funcionamento

```mermaid
graph TD
    A[Usuário cria ticket] --> B[Sistema analisa título]
    B --> C{Contém palavra-chave?}
    C -->|Suporte| D[Notifica equipe Suporte]
    C -->|CS| E[Notifica equipe CS]
    C -->|Tráfego| F[Notifica equipe Tráfego]
    C -->|Nenhuma| G[Notifica equipe Suporte (padrão)]
    D --> H[Ticket criado + Notificação enviada]
    E --> H
    F --> H
    G --> H
```

## 🎯 Exemplos de Uso

### Tickets que vão para Suporte Técnico:
- `!ticket create Problema com login`
- `!ticket create Bug no sistema`
- `!ticket create Erro ao carregar página`

### Tickets que vão para Customer Success:
- `!ticket create Dúvida sobre vendas`
- `!ticket create Atendimento ao cliente`
- `!ticket create Proposta comercial`

### Tickets que vão para Tráfego Pago:
- `!ticket create Campanha de marketing`
- `!ticket create Anúncio não está funcionando`
- `!ticket create Lead não está convertendo`

## 🔧 Personalização

### Adicionar Nova Equipe

1. **Atualizar `src/config/teams.config.ts`:**
```typescript
export const teamsConfig = () => ({
  channels: {
    // ... equipes existentes
    novaEquipe: process.env.NOVA_EQUIPE_CHANNEL_ID || 'ID_DO_CANAL',
  },
  roles: {
    // ... cargos existentes
    novaEquipe: process.env.NOVA_EQUIPE_ROLE_ID || 'ID_DO_CARGO',
  },
});
```

2. **Atualizar `src/discord/teams.service.ts`:**
```typescript
getTeamsConfig(): TeamConfig[] {
  return [
    // ... equipes existentes
    {
      channelId: this.config.channels.novaEquipe,
      roleId: this.config.roles.novaEquipe,
      keywords: ['palavra1', 'palavra2', 'palavra3'],
      name: 'Nova Equipe',
      color: 0x123456,
      emoji: '🆕',
    },
  ];
}
```

3. **Adicionar variável de ambiente:**
```env
NOVA_EQUIPE_CHANNEL_ID=ID_DO_CANAL
NOVA_EQUIPE_ROLE_ID=ID_DO_CARGO
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Equipe não recebe notificação:**
   - Verifique se os IDs dos canais e cargos estão corretos
   - Confirme se o bot tem permissão para enviar mensagens no canal
   - Verifique se o cargo existe e tem membros

2. **Ticket não é direcionado corretamente:**
   - Adicione mais palavras-chave específicas da equipe
   - Verifique se as palavras-chave estão em minúsculas na configuração

3. **Erro de permissões:**
   - Confirme se o bot tem as permissões necessárias:
     - `Send Messages`
     - `View Channel`
     - `Mention Everyone` (para mencionar cargos)

## 📊 Monitoramento

### Logs Importantes

- `Ticket direcionado para equipe: [Nome da Equipe]`
- `Notificação enviada para equipe [Nome] no canal [ID]`
- `Erro ao notificar equipe [Nome]: [Erro]`

### Métricas Úteis

- Use `!ticket stats` para ver número de membros por equipe
- Monitore logs para identificar problemas de direcionamento
- Acompanhe tickets por equipe no banco de dados

## 🔒 Segurança

- IDs de canais e cargos são sensíveis - mantenha-os seguros
- Use variáveis de ambiente para configurações
- Monitore permissões do bot regularmente
- Faça backup das configurações antes de alterações

---

**Desenvolvido com ❤️ para o Sistema de Tickets Discord**
