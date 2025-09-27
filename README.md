# 🎫 Ticket Discord Bot

Sistema de gerenciamento de tickets para Discord construído com NestJS e MySQL.

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

### Comandos Discord
- `!ticket create <título>` - Cria um novo ticket
- `!ticket close` - Fecha seu ticket aberto
- `!ticket list` - Lista seus tickets
- `!ticket help` - Mostra ajuda
- `/ticket create` - Comando slash para criar ticket
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

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
