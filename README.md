# 🍽️ God Level Analytics - Restaurant Analytics Platform

Plataforma de Analytics para Restaurantes - Uma solução completa de Business Intelligence customizável para restaurantes, permitindo análise de vendas, produtos, clientes e operações através de múltiplos canais.

## 📋 Sobre o Projeto

Esta aplicação foi desenvolvida para resolver o desafio de fornecer analytics personalizados para donos de restaurantes, permitindo que eles explorem seus próprios dados sem precisar de conhecimento técnico. É como um "Power BI para restaurantes" ou "Metabase específico para food service".

### ✨ Funcionalidades Principais

- **Dashboard Executivo**: Visualização de faturamento, pedidos, ticket médio, descontos e participação por canal
- **Top Produtos Mais Vendidos**: Análise de produtos por quantidade ou receita, com filtros por período e canal, com drill-down interativo
- **Horários de Pico**: Identificação dos períodos de maior movimento
- **Performance por Loja**: Comparação de métricas entre lojas com ordenação customizável (até 5 lojas)
- **Análise de Clientes**: Segmentação de clientes, produtos favoritos, dias/horários preferidos e detecção de risco de churn
- **Insights Automáticos**: Geração automática de insights baseados em anomalias e comparações, respondendo perguntas específicas de negócio
- **Explorador de Dados Avançado**: 
  - Perfilamento de dados
  - Análise de correlações
  - Análise de retenção por coorte
  - Detecção de anomalias
  - Análise de afinidade de produtos (Market Basket)
  - Previsão de tendências
- **Query Builder Visual**: Interface visual para criar queries customizadas sem escrever SQL, com exemplos pré-configurados
- **Análise Detalhada**: Visualização detalhada de métricas, tendências diárias/horárias e breakdowns por loja, produto ou canal
- **Filtros por Canal**: Visualização de dados por canais de venda (iFood, Rappi, Uber Eats, etc.)
- **Autenticação**: Sistema de autenticação mock com diferentes níveis de acesso (Admin, Proprietária, Gerente)
- **Exportação de Dados**: Exportação de resultados em CSV

## 🛠️ Tecnologias

### Backend
- **Python 3.10+**
- **FastAPI**: Framework web assíncrono de alta performance
- **asyncpg**: Cliente PostgreSQL assíncrono com connection pooling
- **PostgreSQL**: Banco de dados transacional
- **Pydantic**: Validação de dados e schemas
- **Arquitetura em Camadas**: Separação clara entre rotas, serviços e repositórios

### Frontend
- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática para maior segurança
- **Tailwind CSS**: Estilização utility-first com design moderno
- **Recharts**: Biblioteca de gráficos interativos
- **@tanstack/react-query**: Gerenciamento de estado do servidor com cache
- **Lucide React**: Ícones modernos e consistentes
- **date-fns**: Manipulação de datas

### Infraestrutura
- **Docker & Docker Compose**: Containerização e orquestração
- **PostgreSQL**: Banco de dados (via Docker)
- **Vercel**: Deploy do frontend (opcional)
- **Connection Pooling**: Otimização de conexões com o banco

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Docker](https://www.docker.com/get-started) (versão 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0+)
- [Git](https://git-scm.com/downloads)

**Opcional** (para desenvolvimento local sem Docker):
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 14+](https://www.postgresql.org/download/)

## 🚀 Como Baixar e Executar

### 1. Clonar o Repositório

```bash
git clone https://github.com/eedanilo/godLevel.git
cd godLevel/nola-god-level
```

### 2. Configurar e Iniciar o Ambiente

#### Opção A: Executar tudo com Docker (Recomendado)

```bash
# Executar script de inicialização
chmod +x start.sh
./start.sh
```

Este script irá:
- Iniciar o PostgreSQL em um container Docker
- Gerar 500.000+ vendas de teste (6 meses, 50 lojas, múltiplos canais)
- Aguardar a conclusão da geração de dados
- Exibir informações de acesso

**Ou manualmente:**

```bash
# Iniciar apenas o banco de dados e gerador de dados
docker-compose up -d postgres data-generator

# Aguardar a geração de dados (pode levar alguns minutos)
# Verifique os logs: docker-compose logs -f data-generator

# Quando a geração terminar, inicie backend e frontend
docker-compose up -d backend frontend
```

#### Opção B: Executar Localmente (Desenvolvimento)

**Backend:**

```bash
cd backend

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
export DATABASE_URL="postgresql://challenge:challenge_2024@127.0.0.1:5432/challenge_db"
export DATABASE_HOST="127.0.0.1"

# Executar aplicação
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**

```bash
cd frontend

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

### 3. Acessar a Aplicação

Após iniciar os serviços:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs
- **PGAdmin** (se habilitado): http://localhost:5050

### 4. Credenciais de Acesso

O sistema possui três usuários de demonstração:

1. **Admin** (Acesso completo)
   - Email: `admin@restaurante.com`
   - Senha: `admin123`

2. **Proprietária** (Acesso completo)
   - Email: `proprietaria@restaurante.com`
   - Senha: `proprietaria123`

3. **Gerente** (Acesso limitado à loja específica)
   - Email: `gerente@restaurante.com`
   - Senha: `gerente123`

### 5. Usar a Aplicação

1. **Login**: Acesse http://localhost:3000 e faça login com uma das credenciais acima
2. **Dashboard Principal**: Visualize métricas gerais, top produtos e performance de lojas
3. **Explorar Métricas**: Use os filtros de data e canal no topo
4. **Visualizar Produtos**: Clique em "Top Produtos" para ver produtos mais vendidos (com drill-down)
5. **Análise de Lojas**: Acesse "Comparar Lojas" para comparar até 5 lojas
6. **Análise de Clientes**: Veja segmentação de clientes e risco de churn
7. **Insights**: Veja insights automáticos na aba "Insights & Tendências"
8. **Explorar Dados**: Use o "Query Builder" para criar queries customizadas com exemplos pré-configurados
9. **Análise Avançada**: Acesse "Análise Avançada" para análises estatísticas complexas

## 📊 Dados de Teste

O projeto inclui um gerador de dados que cria:

- **500.000+ vendas** completadas
- **6 meses** de histórico (maio a outubro de 2025)
- **50 lojas** distribuídas
- **6 canais** de venda diferentes:
  - Presencial
  - iFood
  - Rappi
  - Uber Eats
  - App Próprio
  - WhatsApp
- **200+ produtos** diferentes
- **Padrões realistas**: horários de pico, sazonalidade, eventos especiais

## 🗂️ Estrutura do Projeto

```
nola-god-level/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/      # Rotas da API organizadas
│   │   │       ├── auth.py           # Autenticação
│   │   │       ├── health.py         # Health checks
│   │   │       ├── metrics.py        # Métricas principais
│   │   │       └── explore_routes.py # Análise avançada
│   │   ├── core/            # Configurações centrais
│   │   │   ├── config.py      # Configurações da aplicação
│   │   │   ├── database.py   # Pool de conexões
│   │   │   ├── cache.py      # Sistema de cache
│   │   │   ├── logging_config.py # Configuração de logs
│   │   │   └── migrations.py # Migrações e índices
│   │   ├── repositories/    # Camada de acesso a dados
│   │   │   ├── base.py
│   │   │   ├── metrics_repository.py
│   │   │   ├── sales_repository.py
│   │   │   └── explore_repository.py
│   │   ├── services/        # Lógica de negócio
│   │   │   ├── metrics_service.py
│   │   │   └── explore_service.py
│   │   ├── models/          # Schemas Pydantic
│   │   │   └── schemas.py
│   │   ├── middleware/      # Middleware customizado
│   │   │   ├── rate_limit.py
│   │   │   └── logging_middleware.py
│   │   └── utils/           # Utilidades
│   │       ├── query_validation.py
│   │       ├── metrics.py
│   │       └── serializers.py
│   ├── main.py              # Arquivo principal (legacy)
│   ├── main_refactored.py   # Arquivo principal (arquitetura em camadas)
│   ├── requirements.txt     # Dependências Python
│   ├── Dockerfile           # Imagem Docker do backend
│   └── tests/               # Testes automatizados
│
├── frontend/                # Aplicação Next.js
│   ├── app/                 # App Router do Next.js
│   │   ├── dashboard/       # Página de dashboard
│   │   ├── explore/         # Query Builder e análise detalhada
│   │   ├── explore-enhanced/ # Análise avançada (tabs)
│   │   ├── login/           # Página de login
│   │   └── page.tsx         # Landing page
│   ├── components/          # Componentes React
│   │   ├── RevenueCard.tsx
│   │   ├── TopProductsChart.tsx
│   │   ├── StorePerformanceTable.tsx
│   │   ├── CustomersPanel.tsx
│   │   ├── InsightsPanel.tsx
│   │   ├── QueryBuilder.tsx
│   │   ├── DetailedAnalysisPanel.tsx
│   │   ├── Navigation.tsx
│   │   └── explore/         # Componentes de análise avançada
│   ├── contexts/           # Contextos React
│   │   └── AuthContext.tsx
│   ├── lib/                 # Utilitários
│   │   ├── api.ts           # Cliente API
│   │   ├── auth.ts          # Utilitários de autenticação
│   │   └── utils.ts         # Funções utilitárias
│   ├── package.json         # Dependências Node.js
│   └── Dockerfile           # Imagem Docker do frontend
│
├── docker-compose.yml       # Orquestração dos containers
├── database-schema.sql      # Schema do banco de dados
├── generate_data.py         # Gerador de dados de teste
├── start.sh                 # Script de inicialização
├── SOLUCAO.md               # Documentação da solução
├── ARQUITETURA.md           # Decisões arquiteturais
├── DEPLOY.md                # Guia de deploy
└── README.md                # Este arquivo
```

## 🔧 Configuração

### Variáveis de Ambiente

**Backend** (`backend/`):
- `DATABASE_URL`: URL de conexão do PostgreSQL (padrão: `postgresql://challenge:challenge_2024@127.0.0.1:5432/challenge_db`)
- `DATABASE_HOST`: Host do banco (padrão: `127.0.0.1`)
- `ENVIRONMENT`: Ambiente de execução (`development` ou `production`)
- `CORS_ORIGINS`: Origens permitidas para CORS
- `RATE_LIMIT_ENABLED`: Habilitar rate limiting (padrão: `true`)
- `RATE_LIMIT_PER_MINUTE`: Limite de requisições por minuto (padrão: `100`)

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL`: URL da API backend (padrão: `http://localhost:8000`)

### Portas

- **Frontend**: 3000
- **Backend**: 8000
- **PostgreSQL**: 5432
- **PGAdmin** (opcional): 5050

## 📖 Funcionalidades Detalhadas

### Dashboard

- **Métricas Principais**: Faturamento total, total de pedidos, ticket médio, descontos aplicados
- **Participação por Canal**: Gráfico de pizza mostrando a participação de cada canal no faturamento
- **Top Produtos**: Gráfico de barras interativo com drill-down para análise detalhada
- **Performance de Lojas**: Tabela com ordenação customizável por qualquer coluna
- **Análise de Clientes**: Painel completo com filtros e ordenação
- **Filtros Dinâmicos**: Filtro por período (data inicial e final) e por canal de venda

### Query Builder

- **Interface Visual**: Crie queries sem escrever SQL
- **Exemplos Pré-configurados**: 5 exemplos de queries funcionais para começar rapidamente
- **Campos Disponíveis**: Dimensões (campos para agrupar) e métricas (cálculos e agregações)
- **Filtros Customizados**: Adicione filtros com diferentes operadores (igual, maior que, contém, etc.)
- **Agrupamento e Ordenação**: Agrupe por campos e ordene por aliases ou campos
- **Exportação**: Exporte os resultados em CSV

### Análise Avançada

1. **Perfilamento de Dados**: Estatísticas descritivas (min, max, média, mediana, quartis, desvio padrão)
2. **Análise de Correlações**: Relações entre variáveis (desconto vs receita, dia/hora vs vendas)
3. **Análise de Cohortes**: Retenção de clientes por mês de aquisição
4. **Detecção de Anomalias**: Identificação de padrões incomuns usando análise estatística
5. **Análise de Afinidade**: Market Basket Analysis para identificar produtos frequentemente comprados juntos
6. **Previsão de Tendências**: Previsão de receita, pedidos e ticket médio usando regressão linear

### Autenticação e Autorização

- **Sistema Mock**: Autenticação mock para demonstração
- **Níveis de Acesso**:
  - **Admin**: Acesso completo a todos os dados
  - **Proprietária**: Acesso completo a todos os dados
  - **Gerente**: Acesso limitado aos dados da loja específica
- **Proteção de Rotas**: Rotas protegidas com verificação de autenticação

## 🐛 Troubleshooting

### Problema: Banco de dados não conecta

**Solução:**
```bash
# Verificar se o container está rodando
docker-compose ps

# Ver logs do PostgreSQL
docker-compose logs postgres

# Reiniciar containers
docker-compose restart postgres
```

### Problema: Dados não aparecem

**Solução:**
- Verifique se a geração de dados foi concluída: `docker-compose logs data-generator`
- Confirme que as datas selecionadas estão no período dos dados gerados (padrão: maio a outubro de 2025)
- Verifique se o backend está conectado ao banco correto (verificar logs)
- Certifique-se de que está logado com uma conta válida

### Problema: Frontend não carrega

**Solução:**
```bash
# Verificar se o backend está rodando
curl http://localhost:8000/api/health

# Ver logs do frontend
docker-compose logs frontend

# Rebuild do container
docker-compose up -d --build frontend
```

### Problema: Porta já em uso

**Solução:**
- Altere as portas no `docker-compose.yml` ou pare o serviço que está usando a porta

### Problema: Queries de exemplo não funcionam

**Solução:**
- Verifique se o backend está na versão mais recente (ORDER BY com aliases foi corrigido)
- Certifique-se de que as datas estão no período correto
- Verifique os logs do backend para erros específicos

## 🚀 Deploy

### Frontend (Vercel)

O frontend está configurado para deploy no Vercel:

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL`: URL do backend em produção
3. Deploy automático via GitHub

### Backend

O backend pode ser deployado em qualquer plataforma que suporte Python/FastAPI:

- **Opções**: Railway, Render, Heroku, AWS, Google Cloud, Azure
- **Requisitos**: PostgreSQL como banco de dados
- **Variáveis de Ambiente**: Configure `DATABASE_URL` e outras variáveis necessárias

Veja mais detalhes em [DEPLOY.md](./DEPLOY.md)

## 📚 Documentação Adicional

- [SOLUCAO.md](./SOLUCAO.md): Documentação completa da solução
- [ARQUITETURA.md](./ARQUITETURA.md): Decisões arquiteturais e design
- [QUICKSTART.md](./QUICKSTART.md): Guia rápido de início
- [DEPLOY.md](./DEPLOY.md): Guia de deploy
- [AVALIACAO.md](./AVALIACAO.md): Critérios de avaliação e checklist

## 🧪 Testes

```bash
cd backend

# Instalar dependências de teste
pip install -r requirements.txt pytest pytest-asyncio

# Executar testes
pytest tests/

# Executar testes com coverage
pytest tests/ --cov=app --cov-report=html
```

## 🔐 Segurança

- **Validação de Entrada**: Todos os campos são validados e sanitizados
- **SQL Injection Protection**: Uso de queries parametrizadas e whitelist de campos
- **Rate Limiting**: Proteção contra abuso de API
- **CORS Configurado**: Apenas origens permitidas podem acessar a API
- **Connection Pooling**: Prevenção de esgotamento de conexões
- **Logging**: Logs estruturados para auditoria e debugging

## 🎨 Design e UX

- **Design Moderno**: Interface limpa e profissional com gradientes e animações suaves
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Tooltips**: Explicações contextuais em campos e atributos
- **Loading States**: Feedback visual durante carregamento de dados
- **Error Handling**: Mensagens de erro claras e acionáveis
- **Navegação Intuitiva**: Menu de navegação claro e acessível

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto foi desenvolvido como parte de um desafio técnico.

## 👤 Autor

**eedanilo**

- GitHub: [@eedanilo](https://github.com/eedanilo)

## 🙏 Agradecimentos

- Desafio fornecido pela NOLA
- Dados de teste realistas para demonstração
- Comunidade open source pelas ferramentas utilizadas

## 📈 Roadmap Futuro

- [ ] Sistema de autenticação completo com JWT
- [ ] Multi-tenancy completo
- [ ] Cache distribuído (Redis)
- [ ] Data Warehouse separado (OLAP)
- [ ] Agendamento de relatórios
- [ ] Notificações de alertas
- [ ] API GraphQL como alternativa
- [ ] Integração com sistemas externos (iFood API, etc.)
- [ ] Dashboard mobile nativo
- [ ] Machine Learning para previsões mais avançadas

---

⭐ Se este projeto foi útil, considere dar uma estrela no repositório!
