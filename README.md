# 🎫 Ticket Discord Bot

Sistema completo de gerenciamento de tickets para Discord com dashboard web moderno, construído com NestJS, MySQL e React.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js (v18 ou superior)
- MySQL (v8.0 ou superior)
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd ticket_discord
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações do MySQL
```

4. **Configure o banco de dados**
```bash
npm run setup:db
```

5. **Execute a aplicação**
```bash
# Modo desenvolvimento
npm run start:dev

# Modo produção
npm run build
npm run start:prod
```

## 📊 Endpoints Disponíveis

### API REST
- `GET /` - Hello World
- `GET /health` - Status da aplicação e banco de dados
- `GET /database/info` - Informações do banco de dados
- `GET /tickets` - Lista todos os tickets
- `GET /tickets?userId=<id>` - Lista tickets de um usuário
- `GET /tickets?clientId=<id>` - Lista tickets de um cliente
- `GET /tickets/stats` - Estatísticas dos tickets
- `POST /tickets` - Cria um ticket
- `PATCH /tickets/:id/close` - Fecha um ticket

### API Leadfy
- `GET /leadfy/clients` - Lista todos os clientes
- `GET /leadfy/clients/:id` - Busca cliente específico
- `GET /leadfy/clients/search?q=termo` - Busca clientes
- `POST /leadfy/sync` - Força sincronização
- `GET /leadfy/stats` - Estatísticas de clientes
- `GET /leadfy/health` - Status da integração
- `GET /leadfy/validate/:id` - Valida cliente

### API SLA (Service Level Agreement)
- `GET /sla/metrics` - Métricas gerais de SLA
- `GET /sla/metrics/period?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Métricas de SLA por período
- `GET /sla/metrics/ticket/:id` - Métricas de SLA de um ticket específico
- `POST /sla/metrics/ticket/:id/update` - Atualiza métricas de SLA de um ticket
- `GET /sla/configs` - Lista configurações de SLA ativas
- `GET /sla/configs/:category/:priority` - Busca configuração específica
- `POST /sla/configs` - Cria nova configuração de SLA
- `GET /sla/status` - Status atual de SLA (tempo real)

### API Dashboard
- `GET /dashboard/overview` - Visão geral do dashboard
- `GET /dashboard/kpis` - KPIs principais
- `GET /dashboard/metrics` - Métricas detalhadas (com filtros de período)
- `GET /dashboard/metrics/today` - Métricas de hoje
- `GET /dashboard/metrics/week` - Métricas da semana
- `GET /dashboard/metrics/month` - Métricas do mês
- `GET /dashboard/metrics/quarter` - Métricas do trimestre
- `GET /dashboard/metrics/year` - Métricas do ano
- `GET /dashboard/performance` - Relatório de performance (com filtros)
- `GET /dashboard/performance/month` - Performance do mês atual
- `GET /dashboard/performance/quarter` - Performance do trimestre atual
- `GET /dashboard/performance/year` - Performance do ano atual
- `GET /dashboard/alerts` - Alertas ativos
- `GET /dashboard/trends` - Tendências e comparações
- `GET /dashboard/distribution/status` - Distribuição por status
- `GET /dashboard/distribution/priority` - Distribuição por prioridade
- `GET /dashboard/distribution/category` - Distribuição por categoria
- `GET /dashboard/distribution/hourly` - Distribuição horária
- `GET /dashboard/performance/agents` - Performance por agente
- `GET /dashboard/trends/daily` - Tendências diárias
- `GET /dashboard/sla/details` - Métricas SLA detalhadas
- `GET /dashboard/charts/timeline` - Dados para gráficos temporais
- `GET /dashboard/charts/distribution` - Dados para gráficos de distribuição

### Comandos Discord
- `!ticket create <título>` - Cria um novo ticket
- `!ticket close` - Fecha seu ticket aberto
- `!ticket list` - Lista seus tickets
- `!ticket help` - Mostra ajuda
- `/criar-ticket` - Comando slash para criar ticket (com autocomplete Leadfy)
- `/criar-ticket-c7auto` - Comando slash específico para tickets C7 Auto
- `/ajuda` - Mostra ajuda sobre o sistema
- `/ticket close` - Comando slash para fechar ticket
- `/ticket list` - Comando slash para listar tickets

## 🗄️ Banco de Dados

O sistema utiliza MySQL com TypeORM para gerenciamento de dados. A configuração está em `src/config/database.config.ts`.

### Migrações
```bash
# Executar migrações
npm run migration:run

# Reverter última migração
npm run migration:revert

# Gerar nova migração
npm run migration:generate -- src/database/migrations/NomeDaMigracao
```

## 🏗️ Arquitetura

```
src/
├── config/           # Configurações do projeto
├── database/         # Configuração e entidades do banco
│   ├── entities/     # Entidades do TypeORM
│   ├── migrations/   # Migrações do banco
│   └── database.module.ts
├── modules/          # Módulos de funcionalidades
└── shared/           # Utilitários compartilhados
```

## 🔧 Configuração

As configurações são gerenciadas através de variáveis de ambiente no arquivo `.env`:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=ticket_discord
PORT=3000
NODE_ENV=development

# Discord
DISCORD_TOKEN=seu_token_aqui
GUILD_ID=id_do_servidor
CLIENT_ID=id_do_bot

# Equipes e Canais
SUPORTE_CHANNEL_ID=id_canal_suporte
CS_CHANNEL_ID=id_canal_cs
TRAFEGO_CHANNEL_ID=id_canal_trafego
FINANCEIRO_CHANNEL_ID=id_canal_financeiro
SUPORTE_ROLE_ID=id_cargo_suporte
CS_ROLE_ID=id_cargo_cs
TRAFEGO_ROLE_ID=id_cargo_trafego
FINANCEIRO_ROLE_ID=id_cargo_financeiro

# C7 Auto - Canal específico para tickets da agência C7 Auto
DISCORD_C7AUTO_CHANNEL_ID=id_canal_c7auto
```

## 📝 Scripts Disponíveis

- `npm run start:dev` - Inicia em modo desenvolvimento
- `npm run build` - Compila o projeto
- `npm run start:prod` - Inicia em modo produção
- `npm run setup:db` - Configura o banco de dados
- `npm run setup:discord` - Registra comandos slash do Discord
- `npm run test:leadfy` - Testa conexão com API Leadfy
- `npm run migration:run` - Executa migrações
- `npm run test` - Executa testes

## 🚗 C7 Auto - Fluxo Específico

O sistema inclui um fluxo dedicado para atender a agência C7 Auto, que não está integrada com a Leadfy.

### Características do Fluxo C7 Auto:
- **Comando específico**: `/criar-ticket-c7auto` (global, sem autocomplete)
- **Modal personalizado** com 3 campos:
  - Título do ticket
  - Nome do cliente (texto livre)
  - Descrição detalhada
- **Thread privada** no canal específico (`DISCORD_C7AUTO_CHANNEL_ID`)
- **Permissões restritas**: apenas equipe de suporte + criador do ticket
- **Botões padrão**: Puxar, Transferir, Arquivar (mesmos dos demais tickets)

### Configuração:
1. Configure `DISCORD_C7AUTO_CHANNEL_ID` no `.env`
2. Execute `npm run setup:discord` para registrar o comando
3. O comando estará disponível globalmente em todos os servidores

### Uso:
1. Usuário executa `/criar-ticket-c7auto`
2. Modal é exibido com os 3 campos
3. Após submit, ticket é criado e thread é aberta no canal específico
4. Equipe de suporte recebe notificação automática

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

## 🎯 Dashboard Web

### Frontend React
O sistema inclui um dashboard web moderno e responsivo para visualização de métricas SLA em tempo real.

#### **Funcionalidades do Dashboard**
- 📊 **Métricas em Tempo Real**: KPIs principais com atualização automática
- 📈 **Gráficos Interativos**: Timeline, distribuições e tendências
- 🚨 **Sistema de Alertas**: Notificações proativas de problemas
- 👥 **Performance de Agentes**: Rankings e métricas individuais
- 📱 **Interface Responsiva**: Funciona em desktop, tablet e mobile

#### **Tecnologias do Frontend**
- **React 18** + **TypeScript** - Interface moderna e tipada
- **Material-UI** - Componentes de design profissional
- **Recharts** - Gráficos interativos e responsivos
- **Axios** - Comunicação com API REST

#### **Executar Dashboard**
```bash
# Configurar frontend
npm run setup:frontend

# Iniciar em desenvolvimento
npm run frontend:start

# Build para produção
npm run frontend:build

# Testar frontend
npm run test:frontend
```

**Acesso**: http://localhost:3001

---

## 📚 Documentação

- [Setup SLA](SLA_SETUP.md) - Configuração do sistema SLA
- [Setup Dashboard](DASHBOARD_SETUP.md) - Configuração do dashboard backend
- [Frontend README](frontend/README.md) - Documentação do frontend React

## 🎯 Funcionalidades Implementadas

### ✅ Fase 1 - Backend SLA
- Sistema de métricas SLA completo
- Configurações dinâmicas
- Cálculos em tempo real
- APIs REST para métricas

### ✅ Fase 2 - Dashboard Backend  
- Agregações avançadas de dados
- 25+ endpoints especializados
- Sistema de alertas inteligente
- Relatórios de performance

### ✅ Fase 3 - Frontend Dashboard
- Interface React moderna e responsiva
- Gráficos interativos em tempo real
- Sistema de navegação intuitivo
- Experiência mobile-first

## 🚀 Próximos Passos

### Fase 4 - Funcionalidades Avançadas
- Alertas automáticos por email/Discord
- Relatórios exportáveis (PDF/Excel)
- Configurações dinâmicas via interface
- Métricas históricas e comparativas

## 📞 Suporte

Para dúvidas e suporte:
- Documentação completa disponível nos arquivos `.md`
- Scripts de teste para validação de funcionalidades
- Logs detalhados para debugging

## 📄 Licença

Este projeto é licenciado sob a licença MIT.
