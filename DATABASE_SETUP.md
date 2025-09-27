# Configuração do Banco de Dados MySQL

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes configurações:

```env
# Configurações do MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=ticket_discord

# Configurações da aplicação
PORT=3000
NODE_ENV=development
```

## Instalação das Dependências

```bash
npm install
```

## Configuração do MySQL

1. Certifique-se de que o MySQL está rodando
2. Crie o banco de dados:
```sql
CREATE DATABASE ticket_discord;
```

## Executando a Aplicação

```bash
# Modo desenvolvimento
npm run start:dev

# Modo produção
npm run build
npm run start:prod
```

## Endpoints de Teste

- `GET /` - Hello World
- `GET /health` - Status da aplicação e banco
- `GET /database/info` - Informações do banco de dados

## Estrutura do Banco

A aplicação criará automaticamente as tabelas necessárias. A tabela principal é:

### tickets
- `id` (UUID) - Chave primária
- `title` (VARCHAR) - Título do ticket
- `description` (TEXT) - Descrição do ticket
- `status` (VARCHAR) - Status do ticket
- `priority` (VARCHAR) - Prioridade do ticket
- `discordUserId` (VARCHAR) - ID do usuário do Discord
- `discordChannelId` (VARCHAR) - ID do canal do Discord
- `assignedTo` (VARCHAR) - Usuário atribuído
- `metadata` (JSON) - Dados adicionais
- `createdAt` (TIMESTAMP) - Data de criação
- `updatedAt` (TIMESTAMP) - Data de atualização
- `deletedAt` (TIMESTAMP) - Data de exclusão (soft delete)
