# 🚀 God Level Analytics - Solução

Solução completa de analytics customizável para restaurantes. Permite donos de restaurantes explorarem seus dados, criarem dashboards personalizados e obterem insights acionáveis.

## 📋 Visão Geral

Esta solução foi desenvolvida para atender o desafio de criar uma plataforma de analytics customizável para restaurantes, permitindo que usuários não-técnicos explorem seus dados operacionais sem necessidade de escrever código SQL.

### Funcionalidades Principais

✅ **Dashboard Executivo**
- Métricas principais (faturamento, pedidos, ticket médio)
- Visualizações pré-configuradas (tendências, horários de pico, top produtos)
- Filtros por período

✅ **Query Builder Visual**
- Interface drag-and-drop para construir queries
- Sem necessidade de escrever SQL
- Exportação de resultados para CSV

✅ **Visualizações Customizáveis**
- Gráficos de barras, linhas, tabelas
- Comparações entre lojas e canais
- Análises temporais

✅ **Métricas Específicas para Restaurantes**
- Faturamento e receita
- Top produtos mais vendidos
- Horários de pico
- Performance por loja
- Comparação entre canais (iFood, Rappi, etc)
- Tendências diárias

## 🏗️ Arquitetura

A solução utiliza uma arquitetura **frontend/backend separados**:

- **Backend**: FastAPI (Python) com query builder dinâmico
- **Frontend**: Next.js (React) com dashboard builder visual
- **Banco**: PostgreSQL (fornecido no desafio)

Veja detalhes completos em [ARQUITETURA.md](./ARQUITETURA.md)

## 🚀 Instalação e Execução

### Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local do frontend)
- Python 3.11+ (para desenvolvimento local do backend)

### Opção 1: Docker Compose (Recomendado)

```bash
# 1. Subir banco de dados e gerar dados
docker compose down -v 2>/dev/null || true
docker compose build --no-cache data-generator
docker compose up -d postgres
docker compose run --rm data-generator

# 2. Iniciar backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 3. Em outro terminal, iniciar frontend
cd frontend
npm install
npm run dev
```

### Opção 2: Desenvolvimento Local

#### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend estará disponível em: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health

#### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local se necessário (NEXT_PUBLIC_API_URL)

# Executar
npm run dev
```

Frontend estará disponível em: http://localhost:3000

### Verificar Banco de Dados

```bash
# Verificar se os dados foram gerados
docker compose exec postgres psql -U challenge challenge_db -c 'SELECT COUNT(*) FROM sales;'
# Deve mostrar ~500k vendas
```

## 📖 Como Usar

### 1. Dashboard Executivo

Acesse `http://localhost:3000/dashboard` para ver:
- **Overview**: Métricas principais do período selecionado
- **Produtos**: Top 10 produtos mais vendidos
- **Lojas**: Performance comparativa entre lojas
- **Canais**: Comparação entre canais de venda

**Features:**
- Filtro de data no topo
- Visualizações interativas
- Métricas em tempo real

### 2. Explorar Dados

Acesse `http://localhost:3000/explore` para usar o Query Builder:

**Passos:**
1. Selecionar período (datas inicial e final)
2. Adicionar dimensões (campos para agrupar)
3. Adicionar métricas (agregações: soma, média, contagem)
4. Adicionar filtros (condições WHERE)
5. Definir limite de resultados
6. Clicar em "Executar Query"
7. Exportar resultados para CSV (opcional)

**Exemplo de Query:**
- **Dimensão**: `created_at` (agrupar por data)
- **Métrica**: `SUM(total_amount)` (soma do faturamento)
- **Filtro**: `sale_status_desc = 'COMPLETED'`
- **Período**: Últimos 30 dias

## 🧪 Testando a API

### Health Check

```bash
curl http://localhost:8000/api/health
```

### Faturamento

```bash
curl "http://localhost:8000/api/metrics/revenue?start_date=2024-01-01&end_date=2024-01-31"
```

### Top Produtos

```bash
curl "http://localhost:8000/api/metrics/top-products?limit=10&start_date=2024-01-01&end_date=2024-01-31"
```

### Query Builder

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": [
      {"field": "total_amount", "aggregation": "sum", "alias": "faturamento"}
    ],
    "dimensions": [
      {"field": "store_id", "alias": "loja"}
    ],
    "filters": [
      {"field": "sale_status_desc", "operator": "eq", "value": "COMPLETED"}
    ],
    "time_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "limit": 100
  }'
```

## 📁 Estrutura do Projeto

```
nola-god-level/
├── backend/                 # API FastAPI
│   ├── main.py             # Aplicação principal
│   ├── requirements.txt    # Dependências Python
│   ├── Dockerfile          # Container Docker
│   └── .env.example        # Variáveis de ambiente
│
├── frontend/               # Interface Next.js
│   ├── app/                # Páginas e rotas
│   │   ├── page.tsx       # Home
│   │   ├── dashboard/     # Dashboard page
│   │   └── explore/       # Query builder page
│   ├── components/        # Componentes React
│   │   ├── RevenueCard.tsx
│   │   ├── TopProductsChart.tsx
│   │   ├── PeakHoursChart.tsx
│   │   ├── QueryBuilder.tsx
│   │   └── ...
│   ├── lib/               # Utilitários
│   │   ├── api.ts         # Cliente API
│   │   └── utils.ts       # Funções utilitárias
│   ├── package.json       # Dependências Node
│   └── Dockerfile         # Container Docker
│
├── ARQUITETURA.md         # Documentação arquitetural
├── SOLUCAO.md            # Este arquivo
└── docker-compose.yml    # Orquestração Docker
```

## 🎯 Decisões de Design

### Por que FastAPI?

- Performance superior a outros frameworks Python
- Suporte nativo a async/await para queries ao banco
- Validação automática com Pydantic
- Documentação automática (Swagger)

### Por que Next.js?

- SSR para melhor performance
- Excelente developer experience
- Ecosistema React maduro
- TypeScript nativo

### Por que Query Builder Direto?

- Flexibilidade total para usuários
- Não requer conhecimento SQL
- Queries otimizadas automaticamente
- SQL injection protection built-in

### Por que NÃO Data Warehouse?

Para MVP, decidimos usar PostgreSQL diretamente:
- ✅ Simplicidade
- ✅ Volume atual gerenciável (500k vendas)
- ✅ Menos complexidade de infraestrutura
- ✅ Caminho claro para evoluir para DW no futuro

Veja mais detalhes em [ARQUITETURA.md](./ARQUITETURA.md)

## 🔧 Configuração Avançada

### Variáveis de Ambiente

**Backend (.env)**
```env
DATABASE_URL=postgresql://challenge:challenge_2024@localhost:5432/challenge_db
API_URL=http://localhost:8000
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Otimizações de Performance

Para melhorar performance com grandes volumes:

1. **Criar índices:**
```sql
CREATE INDEX idx_sales_date_status ON sales(created_at, sale_status_desc);
CREATE INDEX idx_sales_store_channel ON sales(store_id, channel_id);
```

2. **Materialized Views:**
```sql
CREATE MATERIALIZED VIEW daily_aggregates AS
SELECT 
    DATE(created_at) as date,
    store_id,
    channel_id,
    COUNT(*) as order_count,
    SUM(total_amount) as revenue
FROM sales
WHERE sale_status_desc = 'COMPLETED'
GROUP BY DATE(created_at), store_id, channel_id;
```

3. **Cache (Redis):**
```bash
# Adicionar Redis ao docker-compose
# Implementar cache em queries frequentes
```

## 🚀 Deploy

### Backend (Railway/Heroku/Render)

```bash
# 1. Criar projeto
# 2. Conectar repositório
# 3. Configurar variáveis:
#    - DATABASE_URL
#    - PORT (auto)
```

### Frontend (Vercel)

```bash
# 1. npm install -g vercel
# 2. vercel
# 3. Configurar variáveis:
#    - NEXT_PUBLIC_API_URL
```

## 📊 Métricas e KPIs Disponíveis

A solução fornece acesso a:

- **Financeiro**
  - Faturamento total
  - Ticket médio
  - Descontos aplicados
  - Taxas de entrega

- **Operacional**
  - Volume de pedidos
  - Tempo médio de preparo
  - Tempo médio de entrega
  - Taxa de cancelamento

- **Produtos**
  - Top produtos mais vendidos
  - Receita por produto
  - Quantidade vendida

- **Geográfico**
  - Performance por loja
  - Performance por cidade

- **Canais**
  - Comparação entre canais
  - Ticket médio por canal
  - Volume por canal

- **Temporal**
  - Tendências diárias
  - Horários de pico
  - Padrões semanais

## 🐛 Troubleshooting

### Backend não conecta ao banco

```bash
# Verificar se o banco está rodando
docker compose ps

# Verificar conexão
docker compose exec postgres psql -U challenge challenge_db -c "SELECT 1;"
```

### Frontend não encontra API

```bash
# Verificar variável de ambiente
echo $NEXT_PUBLIC_API_URL

# Verificar se backend está rodando
curl http://localhost:8000/api/health
```

### Erro de CORS

Verificar configuração de CORS no `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    ...
)
```

## 📝 Próximos Passos

Possíveis melhorias futuras:

- [ ] Autenticação completa (usuários e roles)
- [ ] Cache Redis para queries frequentes
- [ ] Data Warehouse separado (BigQuery/Snowflake)
- [ ] ETL com Airbyte + DBT
- [ ] Dashboard builder drag-and-drop completo
- [ ] Exportação para PDF/Excel
- [ ] Notificações e alertas
- [ ] ML para previsões (demanda, churn)
- [ ] Multi-tenancy

## 📚 Documentação Adicional

- [ARQUITETURA.md](./ARQUITETURA.md) - Decisões arquiteturais detalhadas
- [PROBLEMA.md](./PROBLEMA.md) - Contexto do problema
- [DADOS.md](./DADOS.md) - Estrutura de dados
- [AVALIACAO.md](./AVALIACAO.md) - Critérios de avaliação

## 📧 Contato

Para dúvidas sobre a solução:
- GitHub Issues
- Email: [seu-email]

---

**Desenvolvido para o God Level Coder Challenge - Nola 2025**

