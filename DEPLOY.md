# 🚀 Guia de Deploy na Vercel

Este guia explica como fazer deploy da aplicação na Vercel.

## ⚠️ Importante

A Vercel hospeda apenas o **frontend** (Next.js). O **backend** (FastAPI) precisa ser deployado em outra plataforma como:
- **Railway** (recomendado para Python)
- **Render** (free tier disponível)
- **Heroku** (pago)
- **AWS/Google Cloud/Azure** (mais complexo)

Ou você pode usar o frontend na Vercel apontando para um backend deployado em outro lugar.

## 📋 Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Repositório GitHub com o código
3. Backend deployado (para produção) ou rodando localmente (para desenvolvimento)

## 🔧 Passo a Passo

### 1. Conectar Repositório GitHub

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"Add New Project"**
4. Selecione o repositório `godLevel` (ou o nome do seu repositório)
5. A Vercel detectará automaticamente que é um projeto Next.js

### 2. Configurar o Projeto

**Importante**: A Vercel precisa saber que o projeto Next.js está na pasta `frontend/`:

**Opção A: Usando a interface da Vercel**

Nas configurações do projeto:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (ou deixe em branco para auto-detecção)
- **Output Directory**: `.next` (ou deixe em branco para auto-detecção)
- **Install Command**: `npm install` (ou deixe em branco para auto-detecção)

**Opção B: Usando arquivo `vercel.json`** (já incluído no projeto)

O projeto já inclui um `vercel.json` na raiz que configura automaticamente.

### 3. Configurar Variáveis de Ambiente

Na Vercel, vá em **Settings > Environment Variables** e adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `NEXT_PUBLIC_API_URL` | URL do seu backend deployado | Production, Preview, Development |

**Exemplo de valores:**
- **Produção**: `https://seu-backend.railway.app` ou `https://seu-backend.render.com`
- **Preview**: `https://seu-backend.railway.app` (mesmo backend para testes)
- **Development**: `http://localhost:8000` (para desenvolvimento local)

### 4. Deploy do Backend (Opcional mas Recomendado)

Como o backend precisa estar acessível, você pode deployar em:

#### Railway (Recomendado)

1. Acesse [railway.app](https://railway.app)
2. Conecte seu GitHub
3. Crie um novo projeto
4. Adicione um serviço PostgreSQL (para produção) ou use o mesmo banco
5. Adicione um serviço Python
6. Configure:
   - **Source**: Seu repositório GitHub
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `DATABASE_URL`: URL do PostgreSQL
     - `DATABASE_HOST`: Host do banco

#### Render

1. Acesse [render.com](https://render.com)
2. Crie uma conta
3. Clique em **"New Web Service"**
4. Conecte seu repositório
5. Configure:
   - **Environment**: Python 3
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**: Mesmas do Railway

### 5. Fazer Deploy

1. Na Vercel, clique em **"Deploy"**
2. Aguarde o build completar
3. Se houver erros, verifique os logs

### 6. Verificar Deploy

Após o deploy, acesse a URL fornecida pela Vercel (ex: `https://seu-projeto.vercel.app`).

Se aparecer erro 404 ou 500:
- Verifique se as variáveis de ambiente estão configuradas
- Verifique se o backend está acessível na URL configurada
- Verifique os logs do deploy na Vercel

## 🐛 Troubleshooting

### Erro 404 ao acessar a aplicação

**Causa**: A Vercel pode não estar detectando a pasta `frontend/` corretamente.

**Solução**:
1. Vá em **Settings > General > Root Directory**
2. Defina como `frontend`
3. Ou confirme que o `vercel.json` está na raiz do projeto

### Erro ao conectar com o backend

**Causa**: A variável `NEXT_PUBLIC_API_URL` não está configurada ou está incorreta.

**Solução**:
1. Verifique se `NEXT_PUBLIC_API_URL` está configurada nas Environment Variables
2. Verifique se o backend está rodando e acessível
3. Teste a URL do backend diretamente: `curl https://seu-backend.railway.app/health`

### Build falha na Vercel

**Causa**: Problemas com dependências ou TypeScript.

**Solução**:
1. Verifique os logs do build na Vercel
2. Teste o build localmente: `cd frontend && npm run build`
3. Corrija os erros mostrados

### CORS errors

**Causa**: O backend não está permitindo requisições do domínio da Vercel.

**Solução**: No backend (`backend/main.py`), adicione CORS:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, use apenas domínios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📝 Notas Importantes

1. **Backend em Produção**: O backend precisa estar deployado e acessível publicamente para que o frontend funcione.

2. **Banco de Dados**: Em produção, você precisará de um banco PostgreSQL acessível. Pode usar:
   - Railway PostgreSQL
   - Render PostgreSQL
   - Supabase (free tier)
   - Neon (free tier)
   - AWS RDS (pago)

3. **Dados de Teste**: Para produção, você precisará gerar dados no banco de dados de produção ou migrar dados.

4. **Custo**: 
   - Vercel: Free tier generoso
   - Railway: Free tier limitado, depois pago
   - Render: Free tier com limitações

## 🔗 Links Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Railway](https://docs.railway.app)
- [Documentação Render](https://render.com/docs)
- [Guia de Deploy Next.js na Vercel](https://nextjs.org/docs/deployment)

## ✅ Checklist de Deploy

- [ ] Repositório conectado na Vercel
- [ ] Root Directory configurado como `frontend`
- [ ] Variável `NEXT_PUBLIC_API_URL` configurada
- [ ] Backend deployado e acessível
- [ ] Banco de dados de produção configurado
- [ ] CORS configurado no backend
- [ ] Build funciona localmente
- [ ] Deploy bem-sucedido na Vercel
- [ ] Aplicação acessível e funcionando

