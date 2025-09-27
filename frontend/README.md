# 🎯 Ticket Dashboard Frontend

Interface web moderna e responsiva para visualização de métricas SLA do sistema de tickets Discord.

## 🚀 Tecnologias

- **React 18** - Biblioteca para interface de usuário
- **TypeScript** - Tipagem estática para JavaScript
- **Material-UI (MUI)** - Componentes de interface modernos
- **Recharts** - Biblioteca de gráficos interativos
- **Axios** - Cliente HTTP para comunicação com API
- **React Router** - Roteamento para SPA

## 📁 Estrutura do Projeto

```
frontend/
├── public/                 # Arquivos estáticos
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── common/        # Componentes comuns
│   │   ├── dashboard/     # Componentes do dashboard
│   │   └── layout/        # Componentes de layout
│   ├── hooks/             # Hooks customizados
│   ├── pages/             # Páginas da aplicação
│   ├── services/          # Serviços de API
│   ├── types/             # Definições de tipos TypeScript
│   ├── App.tsx           # Componente principal
│   └── index.tsx         # Ponto de entrada
├── package.json
└── tsconfig.json
```

## 🛠️ Instalação e Configuração

### 1. Instalar Dependências

```bash
cd frontend
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Configure a URL da API:

```env
REACT_APP_API_URL=http://localhost:3000
```

### 3. Executar em Desenvolvimento

```bash
npm start
```

A aplicação será aberta em `http://localhost:3001`

### 4. Build para Produção

```bash
npm run build
```

## 🎨 Funcionalidades

### 📊 Dashboard Principal
- **Cards de Métricas**: KPIs principais com indicadores visuais
- **Gráficos Interativos**: Timeline, distribuições e tendências
- **Sistema de Alertas**: Notificações em tempo real
- **Performance de Agentes**: Tabelas com rankings e métricas

### 📱 Design Responsivo
- **Mobile First**: Interface otimizada para dispositivos móveis
- **Sidebar Adaptativa**: Menu que se adapta ao tamanho da tela
- **Componentes Flexíveis**: Layout que se ajusta automaticamente

### 🔄 Atualizações em Tempo Real
- **Auto-refresh**: Dados atualizados automaticamente
- **Health Check**: Status de conexão com a API
- **Indicadores de Loading**: Feedback visual durante carregamento

### 📈 Visualizações Avançadas
- **Gráficos de Linha**: Evolução temporal de métricas
- **Gráficos de Pizza**: Distribuições por categoria/prioridade
- **Gráficos de Barras**: Comparações e rankings
- **Áreas**: Volume de tickets ao longo do tempo

## 🎯 Componentes Principais

### MetricCard
Cartões de métricas com:
- Valores formatados
- Indicadores de tendência
- Cores por status
- Ícones contextuais

### ChartsSection
Seção de gráficos com:
- Múltiplos tipos de visualização
- Dados em tempo real
- Interatividade
- Responsividade

### PerformanceTable
Tabela de performance com:
- Ordenação por colunas
- Indicadores de tendência
- Formatação de tempo
- Ações por agente

### AlertsPanel
Painel de alertas com:
- Classificação por prioridade
- Indicadores visuais
- Contadores de impacto
- Status de sistema

## 🔧 Hooks Customizados

### useDashboardOverview
Gerencia dados do overview principal:
- Métricas resumidas
- Tendências temporais
- Performance geral
- Alertas ativos

### useDashboardMetrics
Gerencia métricas detalhadas:
- Filtros por período
- Métricas por categoria
- Performance por agente
- Distribuições estatísticas

### useAlerts
Gerencia sistema de alertas:
- Atualização automática
- Classificação de prioridade
- Contadores de impacto
- Status em tempo real

## 📊 Integração com API

### Serviço de API
- **Base URL**: Configurável via variável de ambiente
- **Timeout**: 10 segundos para requests
- **Interceptors**: Tratamento automático de erros
- **Tipagem**: Interfaces TypeScript para todas as respostas

### Endpoints Utilizados
- `GET /dashboard/overview` - Visão geral
- `GET /dashboard/kpis` - KPIs principais
- `GET /dashboard/metrics` - Métricas detalhadas
- `GET /dashboard/alerts` - Alertas do sistema
- `GET /dashboard/performance` - Performance de agentes

## 🎨 Tema e Estilização

### Material-UI Theme
- **Paleta de Cores**: Azul primário, vermelho secundário
- **Tipografia**: Roboto com pesos customizados
- **Bordas**: Border radius de 12px
- **Sombras**: Sombras suaves e elegantes

### Responsividade
- **Breakpoints**: xs, sm, md, lg, xl
- **Grid System**: Layout flexível com Grid do MUI
- **Componentes Adaptativos**: Sidebar, tabelas, gráficos

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm start              # Inicia servidor de desenvolvimento

# Build
npm run build         # Gera build de produção

# Testes
npm test              # Executa testes

# Linting
npm run lint          # Verifica código
npm run lint:fix      # Corrige problemas automaticamente
```

## 📱 Compatibilidade

### Navegadores Suportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dispositivos
- Desktop (1920px+)
- Tablet (768px - 1919px)
- Mobile (320px - 767px)

## 🔧 Configurações Avançadas

### Proxy para API
O projeto está configurado com proxy para `http://localhost:3000` no `package.json`.

### Variáveis de Ambiente
- `REACT_APP_API_URL`: URL base da API
- `REACT_APP_ENV`: Ambiente (development/production)
- `REACT_APP_DEBUG`: Modo debug

### Build Otimizado
- **Code Splitting**: Carregamento sob demanda
- **Tree Shaking**: Remoção de código não utilizado
- **Minificação**: Código otimizado para produção
- **Gzip**: Compressão para melhor performance

## 🎯 Próximos Passos

1. **Testes Automatizados**: Implementar testes unitários e de integração
2. **PWA**: Transformar em Progressive Web App
3. **Notificações**: Sistema de notificações push
4. **Exportação**: Funcionalidade de exportar relatórios
5. **Temas**: Suporte a temas claro/escuro

---

**🎉 Dashboard Frontend Implementado com Sucesso!**

Interface moderna, responsiva e totalmente funcional para visualização de métricas SLA em tempo real.
