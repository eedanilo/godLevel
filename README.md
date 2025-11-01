# 🍽️ Restaurant Analytics Platform

Plataforma de Analytics para Restaurantes - Uma solução completa de Business Intelligence customizável para restaurantes, permitindo análise de vendas, produtos, clientes e operações através de múltiplos canais.

## 📋 Sobre o Projeto

Esta aplicação foi desenvolvida para resolver o desafio de fornecer analytics personalizados para donos de restaurantes, permitindo que eles explorem seus próprios dados sem precisar de conhecimento técnico. É como um "Power BI para restaurantes" ou "Metabase específico para food service".

### ✨ Funcionalidades Principais

- **Dashboard Executivo**: Visualização de faturamento, pedidos, ticket médio e descontos
- **Top Produtos Mais Vendidos**: Análise de produtos por quantidade ou receita, com filtros por período e canal
- **Horários de Pico**: Identificação dos períodos de maior movimento
- **Performance por Loja**: Comparação de métricas entre lojas com ordenação customizável
- **Análise de Clientes**: Segmentação de clientes, produtos favoritos, dias/horários preferidos e detecção de risco de churn
- **Insights Automáticos**: Geração automática de insights baseados em anomalias e comparações
- **Explorador de Dados Avançado**: 
  - Perfilamento de dados
  - Análise de correlações
  - Análise de retenção por coorte
  - Detecção de anomalias
  - Análise de afinidade de produtos (Market Basket)
  - Previsão de tendências
- **Query Builder**: Interface visual para criar queries customizadas sem escrever SQL
- **Filtros por Canal**: Visualização de dados por canais de venda (iFood, Rappi, Uber Eats, etc.)

## 🛠️ Tecnologias

### Backend
- **Python 3.10+**
- **FastAPI**: Framework web assíncrono
- **asyncpg**: Cliente PostgreSQL assíncrono
- **PostgreSQL**: Banco de dados transacional

### Frontend
- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Estilização utility-first
- **Recharts**: Biblioteca de gráficos
- **@tanstack/react-query**: Gerenciamento de estado do servidor

### Infraestrutura
- **Docker & Docker Compose**: Containerização e orquestração
- **PostgreSQL**: Banco de dados (via Docker)

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
export DATABASE_URL="postgresql://challenge:challenge@127.0.0.1:5432/challenge_db"
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

### 4. Usar a Aplicação

1. **Dashboard Principal**: Acesse http://localhost:3000
2. **Explorar Métricas**: Use os filtros de data e canal no topo
3. **Visualizar Produtos**: Clique em "Top Produtos" para ver produtos mais vendidos
4. **Análise de Lojas**: Acesse "Performance por Loja" para comparar lojas
5. **Insights**: Veja insights automáticos na aba "Insights & Tendências"
6. **Explorar Dados**: Use o "Explorador de Dados" para criar queries customizadas

## 📊 Dados de Teste

O projeto inclui um gerador de dados que cria:

- **500.000+ vendas** completadas
- **6 meses** de histórico
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
│   │   ├── api/            # Rotas da API
│   │   ├── core/           # Configurações, cache, database
│   │   ├── repositories/   # Camada de acesso a dados
│   │   ├── services/       # Lógica de negócio
│   │   ├── models/         # Schemas Pydantic
│   │   ├── middleware/    # Middleware (rate limiting, logging)
│   │   └── utils/          # Utilidades (validação, métricas)
│   ├── main.py             # Arquivo principal (modo legacy)
│   ├── main_refactored.py  # Arquivo principal (arquitetura em camadas)
│   ├── requirements.txt    # Dependências Python
│   └── Dockerfile          # Imagem Docker do backend
│
├── frontend/               # Aplicação Next.js
│   ├── app/                # App Router do Next.js
│   │   ├── dashboard/      # Página de dashboard
│   │   ├── explore/        # Página de exploração de dados
│   │   └── explore-enhanced/  # Página de análise avançada
│   ├── components/         # Componentes React
│   ├── lib/                # Utilitários (API client, utils)
│   ├── package.json        # Dependências Node.js
│   └── Dockerfile          # Imagem Docker do frontend
│
├── docker-compose.yml      # Orquestração dos containers
├── database-schema.sql     # Schema do banco de dados
├── start.sh                # Script de inicialização
├── SOLUCAO.md              # Documentação da solução
├── ARQUITETURA.md          # Decisões arquiteturais
└── README.md               # Este arquivo
```

## 🔧 Configuração

### Variáveis de Ambiente

**Backend** (`backend/main.py`):
- `DATABASE_URL`: URL de conexão do PostgreSQL (padrão: `postgresql://challenge:challenge@127.0.0.1:5432/challenge_db`)
- `DATABASE_HOST`: Host do banco (padrão: `127.0.0.1`)

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL`: URL da API backend (padrão: `http://localhost:8000`)

### Portas

- **Frontend**: 3000
- **Backend**: 8000
- **PostgreSQL**: 5432
- **PGAdmin** (opcional): 5050

## 📖 Uso da Aplicação

### Dashboard

1. **Selecionar Período**: Use os campos de data no topo para filtrar por período
2. **Filtrar por Canal**: Selecione um ou mais canais de venda
3. **Visualizar Métricas**: Veja faturamento total, pedidos, ticket médio e descontos
4. **Analisar Produtos**: Visualize top produtos ordenados por quantidade ou receita
5. **Comparar Lojas**: Veja performance de todas as lojas com ordenação customizável

### Análise de Clientes

1. Acesse "Clientes" no menu
2. Use os filtros:
   - Produto favorito
   - Dia preferido
   - Hora preferida
   - Risco de churn
3. Ordene por qualquer coluna clicando nos headers

### Explorador de Dados

1. Acesse "Explorar Dados"
2. Selecione dimensões (campos para agrupar)
3. Selecione métricas (cálculos e agregações)
4. Adicione filtros opcionais
5. Execute a query e visualize os resultados

### Análise Avançada

1. Acesse "Análise Avançada" (ou `/explore-enhanced`)
2. Explore as diferentes abas:
   - **Perfilamento**: Estatísticas descritivas dos dados
   - **Correlações**: Relações entre variáveis
   - **Cohortes**: Análise de retenção de clientes
   - **Anomalias**: Detecção de padrões incomuns
   - **Afinidade**: Produtos frequentemente comprados juntos
   - **Previsão**: Tendências futuras baseadas em dados históricos

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
- Confirme que as datas selecionadas estão no período dos dados gerados (padrão: maio 2025)
- Verifique se o backend está conectado ao banco correto (verificar logs)

### Problema: Frontend não carrega

**Solução:**
```bash
# Verificar se o backend está rodando
curl http://localhost:8000/health

# Ver logs do frontend
docker-compose logs frontend

# Rebuild do container
docker-compose up -d --build frontend
```

### Problema: Porta já em uso

**Solução:**
- Altere as portas no `docker-compose.yml` ou pare o serviço que está usando a porta

## 📚 Documentação Adicional

- [SOLUCAO.md](./SOLUCAO.md): Documentação completa da solução
- [ARQUITETURA.md](./ARQUITETURA.md): Decisões arquiteturais e design
- [QUICKSTART.md](./QUICKSTART.md): Guia rápido de início

## 🧪 Testes

```bash
cd backend

# Instalar dependências de teste
pip install -r requirements.txt pytest

# Executar testes
pytest tests/

# Executar testes com coverage
pytest tests/ --cov=app --cov-report=html
```

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

---

⭐ Se este projeto foi útil, considere dar uma estrela no repositório!
