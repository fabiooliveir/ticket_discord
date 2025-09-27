# 🔗 Integração Leadfy - Sistema de Clientes

## Visão Geral

A integração com a Leadfy permite buscar e gerenciar clientes diretamente do sistema de tickets do Discord. Esta integração fornece validação automática de clientes e sincronização de dados.

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Configurações da Leadfy
LEADFY_WEBHOOK_URL=https://workflowinternal.leadfy.pro/webhook/241b97c5-f29c-4215-be94-531a4e490a7d
LEADFY_TOKEN=0GZf0zkLIR5RdK9goaFBrHRRZyvm4VplBtIABZ0q5clUg3H2h9XUiVwkVMhQfzbB
LEADFY_TIMEOUT=10000
LEADFY_RETRY_ATTEMPTS=3
LEADFY_CACHE_TTL=300000
```

### Instalação das Dependências

```bash
npm install
```

## Funcionalidades

### 1. Busca de Clientes
- **Lista completa**: Busca todos os clientes da Leadfy
- **Busca por ID**: Encontra cliente específico
- **Busca por texto**: Pesquisa por nome, email ou empresa
- **Cache inteligente**: Armazenamento local para performance

### 2. Validação de Clientes
- **Validação automática**: Verifica se cliente existe na Leadfy
- **Integração com tickets**: Associa tickets a clientes válidos
- **Fallback para cache**: Usa dados locais quando API indisponível

### 3. Sincronização
- **Sincronização manual**: Força atualização dos dados
- **Sincronização automática**: Atualização em background
- **Controle de concorrência**: Evita múltiplas sincronizações simultâneas

## Endpoints da API

### Clientes

#### `GET /leadfy/clients`
Lista todos os clientes da Leadfy.

**Resposta:**
```json
[
  {
    "id": "1",
    "name": "João Silva",
    "email": "joao@empresa.com",
    "phone": "+55 11 99999-9999",
    "company": "Empresa ABC",
    "status": "active",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
]
```

#### `GET /leadfy/clients/:id`
Busca cliente específico por ID.

**Resposta:**
```json
{
  "id": "1",
  "name": "João Silva",
  "email": "joao@empresa.com",
  "phone": "+55 11 99999-9999",
  "company": "Empresa ABC",
  "status": "active"
}
```

#### `GET /leadfy/clients/search?q=termo`
Busca clientes por termo (nome, email ou empresa).

**Parâmetros:**
- `q` (obrigatório): Termo de busca

**Resposta:**
```json
[
  {
    "id": "1",
    "name": "João Silva",
    "email": "joao@empresa.com",
    "company": "Empresa ABC"
  }
]
```

### Sincronização

#### `POST /leadfy/sync`
Força sincronização dos clientes.

**Resposta:**
```json
{
  "success": true,
  "clientsCount": 150,
  "lastSync": "2023-01-01T12:00:00Z",
  "errors": []
}
```

### Estatísticas

#### `GET /leadfy/stats`
Retorna estatísticas dos clientes.

**Resposta:**
```json
{
  "totalClients": 150,
  "lastSync": "2023-01-01T12:00:00Z",
  "cacheSize": 150,
  "syncInProgress": false
}
```

### Health Check

#### `GET /leadfy/health`
Verifica status da integração.

**Resposta:**
```json
{
  "status": "healthy",
  "lastSync": "2023-01-01T12:00:00Z",
  "clientsCount": 150,
  "apiReachable": true
}
```

### Validação

#### `GET /leadfy/validate/:id`
Valida se cliente existe na Leadfy.

**Resposta:**
```json
{
  "valid": true
}
```

## Integração com Tickets

### Criação de Tickets com Cliente

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Problema no sistema",
    "description": "Cliente reporta erro ao acessar",
    "discordUserId": "123456789",
    "clientId": "1",
    "priority": "high"
  }'
```

### Busca de Tickets por Cliente

```bash
curl "http://localhost:3000/tickets?clientId=1"
```

## Scripts Disponíveis

### Teste da API Leadfy
```bash
npm run test:leadfy
```

Este script testa a conectividade com a API da Leadfy e exibe os dados recebidos.

### Sincronização Manual
```bash
curl -X POST http://localhost:3000/leadfy/sync
```

## Tratamento de Erros

### Erros de Conectividade
- **Timeout**: Retry automático com backoff exponencial
- **Falha de rede**: Fallback para cache local
- **API indisponível**: Uso de dados em cache

### Erros de Validação
- **Cliente não encontrado**: Erro ao criar ticket
- **Token inválido**: Log de erro e fallback
- **Dados corrompidos**: Validação e sanitização

## Monitoramento

### Logs
- **Requisições**: Log de todas as chamadas à API
- **Erros**: Detalhamento de falhas
- **Performance**: Tempo de resposta e cache hits
- **Sincronização**: Status e resultados

### Métricas
- **Taxa de sucesso**: Percentual de requisições bem-sucedidas
- **Tempo de resposta**: Latência média da API
- **Cache hit rate**: Eficiência do cache
- **Sincronizações**: Frequência e sucesso

## Troubleshooting

### API não responde
1. Verificar conectividade de rede
2. Validar URL e token
3. Verificar logs de erro
4. Testar com `npm run test:leadfy`

### Dados desatualizados
1. Forçar sincronização: `POST /leadfy/sync`
2. Verificar último sync: `GET /leadfy/stats`
3. Limpar cache se necessário

### Performance lenta
1. Verificar timeout configurado
2. Ajustar cache TTL
3. Monitorar logs de performance
4. Considerar paginação para grandes volumes

## Desenvolvimento

### Adicionar Novos Campos
1. Atualizar `ClientInterface`
2. Modificar mapeamento de dados
3. Atualizar testes
4. Documentar mudanças

### Novos Endpoints
1. Criar método no `LeadfyService`
2. Adicionar rota no `LeadfyController`
3. Implementar testes
4. Documentar API

### Cache Personalizado
1. Implementar estratégia de cache
2. Configurar TTL por tipo de dado
3. Adicionar invalidação manual
4. Monitorar performance

## Segurança

### Autenticação
- Token obrigatório em todas as requisições
- Validação de token na inicialização
- Rotação de token suportada

### Dados Sensíveis
- Não logar tokens completos
- Sanitizar dados de entrada
- Criptografar cache se necessário

### Rate Limiting
- Controle de requisições por minuto
- Backoff em caso de limite excedido
- Queue para requisições pendentes
