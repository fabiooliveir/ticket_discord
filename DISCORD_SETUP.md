# 🤖 Configuração do Discord Bot

## Pré-requisitos

1. **Bot do Discord criado** no [Discord Developer Portal](https://discord.com/developers/applications)
2. **Permissões necessárias** no servidor:
   - Enviar Mensagens
   - Usar Comandos Slash
   - Gerenciar Canais (para criar canais de ticket)
   - Gerenciar Mensagens
   - Embed Links

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Configurações do Discord
DISCORD_TOKEN=seu_token_aqui
GUILD_ID=id_do_servidor
CLIENT_ID=id_do_bot
```

### 2. Instalação das Dependências

```bash
npm install
```

### 3. Configuração do Banco de Dados

```bash
npm run setup:db
```

### 4. Registro dos Comandos Slash

```bash
npm run setup:discord
```

### 5. Executar a Aplicação

```bash
# Modo desenvolvimento
npm run start:dev

# Modo produção
npm run build
npm run start:prod
```

## Funcionalidades

### Comandos de Texto

- `!ticket create <título>` - Cria um novo ticket
- `!ticket close` - Fecha seu ticket aberto
- `!ticket list` - Lista seus tickets
- `!ticket help` - Mostra ajuda

### Comandos Slash

- `/ticket create` - Cria um novo ticket
- `/ticket close` - Fecha um ticket
- `/ticket list` - Lista seus tickets

### Sistema de Tickets

1. **Criação**: Usuários podem criar tickets com título e descrição
2. **Gerenciamento**: Tickets são salvos no banco de dados MySQL
3. **Status**: Abertos, Fechados
4. **Prioridade**: Alta, Média, Baixa
5. **Interações**: Botões para fechar e alterar prioridade

## Estrutura do Projeto

```
src/
├── discord/
│   ├── discord.module.ts      # Módulo do Discord
│   ├── discord.service.ts     # Serviço principal
│   └── discord.bot.ts         # Cliente do bot
├── modules/
│   └── tickets/               # Módulo de tickets
│       ├── tickets.module.ts
│       ├── tickets.service.ts
│       └── tickets.controller.ts
└── config/
    └── discord.config.ts      # Configurações do Discord
```

## Endpoints da API

- `GET /tickets` - Lista todos os tickets
- `GET /tickets?userId=<id>` - Lista tickets de um usuário
- `GET /tickets/stats` - Estatísticas dos tickets
- `POST /tickets` - Cria um ticket
- `PATCH /tickets/:id/close` - Fecha um ticket
- `DELETE /tickets/:id` - Remove um ticket

## Logs

O bot registra as seguintes atividades:
- Conexão e desconexão
- Criação e fechamento de tickets
- Erros e warnings
- Execução de comandos

## Troubleshooting

### Bot não conecta
- Verifique se o token está correto
- Confirme se o bot tem as permissões necessárias
- Verifique se o servidor está configurado corretamente

### Comandos não aparecem
- Execute `npm run setup:discord`
- Aguarde até 1 hora para comandos globais
- Comandos de servidor aparecem imediatamente

### Erros de banco de dados
- Verifique se o MySQL está rodando
- Confirme as configurações de conexão
- Execute `npm run setup:db`

## Desenvolvimento

### Adicionar Novos Comandos

1. Crie o comando em `src/discord/commands/`
2. Registre no `DiscordService`
3. Atualize o script de setup
4. Execute `npm run setup:discord`

### Adicionar Novos Eventos

1. Crie o evento em `src/discord/events/`
2. Registre no `DiscordBot`
3. Implemente a lógica necessária

### Testes

```bash
# Executar testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:cov
```
