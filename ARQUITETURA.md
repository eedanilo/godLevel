# 🏗️ Documentação de Decisões Arquiteturais

## Visão Geral

Este documento descreve as decisões arquiteturais tomadas na construção da solução de analytics para restaurantes.

## Arquitetura Geral

A solução foi construída seguindo uma arquitetura **frontend/backend separados** com comunicação via API REST:

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│  - Dashboard Builder Visual            │
│  - Query Builder Interativo             │
│  - Visualizações (Recharts)             │
└─────────────────────────────────────────┘
                   ↕ HTTP/REST
┌─────────────────────────────────────────┐
│      Backend (FastAPI)                  │
│  - Query Builder Dinâmico              │
│  - Endpoints de Analytics               │
│  - Cache e Otimizações                  │
└─────────────────────────────────────────┘
                   ↕ SQL
┌─────────────────────────────────────────┐
│   PostgreSQL (OLTP)                     │
│  - Schema Transacional                  │
│  - 500k+ Vendas                          │
└─────────────────────────────────────────┘
```

## Decisões de Tecnologia

### Backend: FastAPI (Python)

**Por quê?**
- **Performance**: FastAPI é um dos frameworks Python mais rápidos, ideal para APIs
- **Async/Await**: Suporte nativo para operações assíncronas com `asyncpg`
- **Type Safety**: Validação automática com Pydantic
- **Documentação Automática**: Swagger/OpenAPI gerado automaticamente
- **Simplicidade**: Código limpo e fácil de manter

**Alternativas Consideradas:**
- **Django**: Mais pesado, melhor para apps completas
- **Flask**: Menos features modernas (async, type hints)
- **Node.js/Express**: Boa opção, mas Python tem melhor ecosistema de data science

### Frontend: Next.js (React)

**Por quê?**
- **Performance**: SSR e otimizações automáticas
- **Developer Experience**: TypeScript, hot reload, ótima DX
- **Ecosistema**: Grande ecosistema React com muitas bibliotecas
- **Routing**: Sistema de rotas file-based intuitivo

**Alternativas Consideradas:**
- **Vue.js/Nuxt**: Também ótima opção, menor ecosistema
- **Angular**: Mais complexo, overkill para este projeto
- **SvelteKit**: Promissor, mas ecosistema menor

### Visualizações: Recharts

**Por quê?**
- **React Native**: Componentes React nativos
- **Customizável**: Fácil de personalizar e estilizar
- **Performance**: Renderização eficiente
- **Responsivo**: Suporte a diferentes tamanhos de tela

**Alternativas Consideradas:**
- **Chart.js**: Não React-native, precisa wrappers
- **D3.js**: Muito poderosa, mas complexa demais
- **Victory**: Boa opção, mas menos popular

### Banco de Dados: PostgreSQL (Direto)

**Por quê?**
- **Já fornecido**: Banco de dados fornecido no desafio
- **Performance**: PostgreSQL é robusto e performático
- **Flexibilidade**: Suporta queries complexas e agregações
- **Sem ETL Inicial**: Decidimos não criar camada de ETL para MVP

**Decisão Crítica: Não criar Data Warehouse**

Para este MVP, decidimos **não criar um Data Warehouse** separado. Razões:
1. **Complexidade**: Adicionaria camada de ETL/ELT complexa
2. **Tempo**: Construir DW levaria muito tempo para MVP
3. **Volume**: 500k vendas ainda é gerenciável diretamente no PostgreSQL
4. **Agregações**: Podemos criar views/materialized views para otimização

**Futuro**: Se escala aumentar, seria recomendado criar DW com:
- Schema dimensional (star schema)
- ETL com Airbyte + DBT
- Data Warehouse (BigQuery, Snowflake, ou PostgreSQL separado)

## Arquitetura de Query Builder

### Sistema de Query Dinâmico

Criamos um sistema de query builder que permite construir SQL dinamicamente baseado em:
- **Dimensões**: Campos para agrupamento
- **Métricas**: Agregações (SUM, AVG, COUNT, etc)
- **Filtros**: Condições WHERE dinâmicas
- **Time Range**: Filtros temporais

**Implementação:**
```python
def build_query(query: QueryRequest) -> Dict[str, Any]:
    # Constrói SQL dinamicamente
    # - SELECT clause baseado em dimensões e métricas
    # - WHERE clause baseado em filtros
    # - GROUP BY baseado em dimensões
    # - ORDER BY e LIMIT opcionais
```

**Vantagens:**
- Flexibilidade total para usuário
- Queries otimizadas automaticamente
- SQL injection protection via parametrização

**Limitações:**
- Ainda requer conhecimento dos campos disponíveis
- Não tem autocomplete avançado (poderia melhorar)

### Endpoints Pré-definidos

Criamos endpoints específicos para métricas comuns:
- `/api/metrics/revenue` - Faturamento agregado
- `/api/metrics/top-products` - Top produtos
- `/api/metrics/peak-hours` - Horários de pico
- `/api/metrics/store-performance` - Performance por loja
- `/api/metrics/channel-comparison` - Comparação de canais
- `/api/metrics/daily-trends` - Tendências diárias

**Por quê?**
- **Performance**: Queries otimizadas para casos específicos
- **Simplicidade**: Usuários não precisam construir queries complexas
- **UX**: Interface mais simples para casos comuns

## Performance e Otimização

### Estratégias Implementadas

1. **Connection Pooling**
   - `asyncpg` pool com 2-10 conexões
   - Reuso de conexões reduz latência

2. **Queries Otimizadas**
   - Índices implícitos em foreign keys
   - Filtros por data criados para time-range queries
   - Apenas vendas COMPLETED por padrão (reduz dataset)

3. **Cache (Futuro)**
   - Planejado: Redis para cache de queries frequentes
   - TTL baseado em tipo de query (hourly trends = 1h, daily trends = 24h)

### Queries Recomendadas para Otimização

Para produção, recomendaríamos criar:

```sql
-- Índice composto para queries temporais
CREATE INDEX idx_sales_date_status ON sales(created_at, sale_status_desc);

-- Materialized view para agregações diárias
CREATE MATERIALIZED VIEW daily_aggregates AS
SELECT 
    DATE(created_at) as date,
    store_id,
    channel_id,
    COUNT(*) as order_count,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_ticket
FROM sales
WHERE sale_status_desc = 'COMPLETED'
GROUP BY DATE(created_at), store_id, channel_id;

-- Refresh periódico
REFRESH MATERIALIZED VIEW daily_aggregates;
```

## Segurança

### Implementações Atuais

1. **SQL Injection Protection**
   - Todas as queries usam parâmetros parametrizados
   - Nenhum input do usuário é concatenado diretamente em SQL

2. **CORS**
   - Configurado para permitir apenas origens específicas
   - Em produção, usar variáveis de ambiente

3. **Validação de Input**
   - Pydantic valida todos os inputs
   - Tipos garantidos no TypeScript

### Melhorias Futuras

1. **Autenticação/Autorização**
   - Sistema de usuários e roles
   - Row-level security baseado em lojas do usuário

2. **Rate Limiting**
   - Limitar queries por usuário/minuto
   - Prevenir abuso da API

3. **Audit Logging**
   - Log de todas as queries executadas
   - Rastreabilidade para compliance

## UX e Interface

### Design Philosophy

1. **Simplicidade Primeiro**
   - Interface limpa e intuitiva
   - Sem jargão técnico desnecessário

2. **Progressive Disclosure**
   - Dashboard simples para casos comuns
   - Query builder para usuários avançados

3. **Feedback Visual**
   - Loading states em todas as operações
   - Mensagens de erro claras
   - Visualizações responsivas

### Componentes Principais

1. **Dashboard Page**
   - Cards de métricas principais
   - Gráficos pré-configurados
   - Filtros de data

2. **Explore Page**
   - Query builder visual
   - Tabela de resultados
   - Exportação CSV

3. **Visualizações**
   - Recharts com customização
   - Responsive design
   - Tooltips informativos

## Trade-offs e Limitações

### Trade-offs Feitos

1. **MVP vs. Produção Completa**
   - Escolhemos funcionalidade core ao invés de features completas
   - Sem autenticação completa (mock básico)
   - Sem multi-tenancy (adicionaria complexidade)

2. **Performance vs. Flexibilidade**
   - Query builder flexível mas pode ser lento em queries muito complexas
   - Endpoints pré-definidos são rápidos mas menos flexíveis

3. **Simplicidade vs. Poder**
   - Interface simples pode limitar casos avançados
   - Balance entre usabilidade e poder

### Limitações Conhecidas

1. **Sem Data Warehouse**
   - Queries complexas podem ser lentas em datasets grandes
   - Solução: Criar agregações/materialized views

2. **Sem Cache**
   - Mesmas queries executadas múltiplas vezes
   - Solução: Implementar Redis cache

3. **Query Builder Básico**
   - Não suporta JOINs complexos manualmente
   - Não tem autocomplete de campos
   - Solução: Melhorar UX do query builder

## Escalabilidade

### Plano de Escala

**Fase 1 (Atual - MVP)**
- PostgreSQL direto
- ~500k vendas
- Queries síncronas

**Fase 2 (Crescimento Médio)**
- Materialized views para agregações
- Cache Redis para queries frequentes
- Índices otimizados

**Fase 3 (Grande Escala)**
- Data Warehouse separado (BigQuery/Snowflake)
- ETL com Airbyte + DBT
- Pipeline de dados incremental
- Separar OLTP de OLAP

## Conclusão

A arquitetura escolhida prioriza:
- ✅ **Simplicidade**: Fácil de entender e manter
- ✅ **Funcionalidade**: Resolve o problema core
- ✅ **Performance**: Boa para o volume atual
- ✅ **Flexibilidade**: Permite crescimento futuro

Decisões tomadas com foco em **entregar valor rápido** enquanto mantém **caminho para escalar** no futuro.

