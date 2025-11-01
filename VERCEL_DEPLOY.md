# 🚀 Guia Rápido de Deploy na Vercel

## ⚠️ Importante sobre o Erro 404

O erro 404 geralmente acontece porque a Vercel não encontra a pasta `frontend/`. Siga os passos abaixo:

## 📋 Passos para Deploy na Vercel

### 1. Conectar Repositório

1. Acesse [vercel.com](https://vercel.com)
2. Faça login e clique em **"Add New Project"**
3. Selecione o repositório `godLevel`
4. A Vercel detectará automaticamente como Next.js

### 2. ⚠️ CONFIGURAR ROOT DIRECTORY (CRÍTICO!)

**Este é o passo mais importante para resolver o 404:**

1. Na tela de configuração do projeto, clique em **"Settings"**
2. Vá em **"General"**
3. Encontre **"Root Directory"**
4. Clique em **"Edit"** e defina como: `frontend`
5. Salve as alterações

**OU** se preferir, use a interface inicial:
- Na tela de configuração, procure por **"Root Directory"** ou **"Configure Project"**
- Defina como `frontend`

### 3. Configurar Variáveis de Ambiente

1. Vá em **"Settings" > "Environment Variables"**
2. Adicione:

| Nome | Valor | Ambientes |
|------|-------|-----------|
| `NEXT_PUBLIC_API_URL` | URL do seu backend | Production, Preview, Development |

**Exemplo de valores:**
- Se o backend estiver em Railway: `https://seu-projeto.railway.app`
- Se o backend estiver em Render: `https://seu-projeto.onrender.com`
- Para desenvolvimento local: `http://localhost:8000`

### 4. Fazer Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar

### 5. Verificar se Funcionou

Após o deploy, acesse a URL fornecida pela Vercel. Se ainda aparecer 404:

1. **Verifique os logs do build** na Vercel (aba "Deployments")
2. **Confirme que o Root Directory está configurado como `frontend`**
3. **Teste o build localmente**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

## 🔧 Configuração Alternativa (via Interface)

Se não encontrar "Root Directory" na interface:

1. Na tela de configuração inicial, clique em **"Show Advanced Options"**
2. Procure por **"Root Directory"** ou **"Framework Preset"**
3. Se ainda não encontrar, crie um arquivo `.vercelignore` na raiz (já incluído)
4. **Importante**: A Vercel deve detectar automaticamente que o Next.js está em `frontend/`

## 🐛 Troubleshooting

### Erro 404 Persiste

**Solução 1**: Verificar estrutura do projeto
```bash
# Certifique-se de que existe:
frontend/package.json
frontend/next.config.js
frontend/app/
```

**Solução 2**: Usar vercel.json (já incluído)
O arquivo `vercel.json` já está na raiz. A Vercel deve ler automaticamente.

**Solução 3**: Criar projeto manualmente
1. Na Vercel, clique em **"Import Project"**
2. Selecione o repositório
3. Na configuração, escolha:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`

### Build Falha

**Causa**: Problemas com dependências ou TypeScript.

**Solução**:
```bash
cd frontend
npm install
npm run build
# Corrija os erros mostrados
```

### Erro de CORS

**Causa**: Backend não permite requisições do domínio da Vercel.

**Solução**: O backend já tem CORS configurado para permitir `*.vercel.app`. Se ainda tiver problemas, verifique:
1. Se o backend está rodando
2. Se a URL do backend está correta na variável `NEXT_PUBLIC_API_URL`

## ✅ Checklist

Antes de fazer deploy, certifique-se de:

- [ ] Root Directory configurado como `frontend`
- [ ] `NEXT_PUBLIC_API_URL` configurada com URL do backend
- [ ] Backend deployado e acessível
- [ ] Build funciona localmente: `cd frontend && npm run build`
- [ ] Sem erros de TypeScript: `cd frontend && npm run lint`

## 📝 Notas

1. **Backend em Produção**: O frontend precisa de um backend acessível. Se você ainda não tem backend deployado:
   - Use Railway: [railway.app](https://railway.app)
   - Use Render: [render.com](https://render.com)

2. **Banco de Dados**: O backend precisa de um PostgreSQL acessível.

3. **Dados de Teste**: Para produção, você precisará gerar dados no banco de produção.

## 🔗 Links Úteis

- [Documentação Vercel - Root Directory](https://vercel.com/docs/projects/project-configuration#root-directory)
- [Documentação Next.js na Vercel](https://nextjs.org/docs/deployment#vercel-recommended)

---

**Dica**: Se continuar com erro 404, tente criar um novo projeto na Vercel e selecionar manualmente a pasta `frontend` como Root Directory.

