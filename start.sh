#!/bin/bash

# Script de inicialização para God Level Analytics

echo "🚀 Iniciando God Level Analytics..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker."
    exit 1
fi

# 1. Subir banco de dados
echo "📦 Subindo banco de dados PostgreSQL..."
docker compose down -v 2>/dev/null || true
docker compose up -d postgres

# Aguardar banco estar pronto
echo "⏳ Aguardando banco de dados estar pronto..."
sleep 10

# 2. Gerar dados
echo "📊 Gerando dados..."
docker compose build --no-cache data-generator 2>/dev/null || true
docker compose run --rm data-generator

# 3. Verificar dados
echo "✅ Verificando dados gerados..."
COUNT=$(docker compose exec -T postgres psql -U challenge challenge_db -t -c 'SELECT COUNT(*) FROM sales;' | xargs)
echo "📈 $COUNT vendas geradas"

# 4. Instruções finais
echo ""
echo "✅ Setup completo!"
echo ""
echo "Para iniciar o backend:"
echo "  cd backend"
echo "  pip install -r requirements.txt"
echo "  uvicorn main:app --reload"
echo ""
echo "Para iniciar o frontend:"
echo "  cd frontend"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"

