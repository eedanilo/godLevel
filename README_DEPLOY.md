# 🚀 Guia de Deploy na Vercel - Resolução de Problemas

## ❌ O nome do projeto na Vercel NÃO precisa ser o mesmo do repositório

Você pode ter qualquer nome na Vercel (ex: `restaurant-analytics`, `godlevel`, etc). O que importa é:
- O **repositório GitHub** conectado
- O **branch** configurado (`main`)
- O **Root Directory** configurado (`frontend`)

## 🔍 Como Verificar e Corrigir

### 1. Verificar Repositório Conectado

1. Vercel → Projeto → **Settings** → **Git**
2. Verifique se mostra:
   - **Repository**: `eedanilo/godLevel`
   - **Production Branch**: `main`
   - **Root Directory**: `frontend` ⚠️ **CRÍTICO**

### 2. Se Root Directory estiver vazio ou errado

**IMPORTANTE**: A Vercel precisa saber que o Next.js está na pasta `frontend/`!

1. Em **Settings** → **General**
2. Procure por **"Root Directory"**
3. Clique em **"Edit"**
4. Digite: `frontend`
5. Salve

### 3. Verificar Build Settings

1. **Settings** → **General** → **Build & Development Settings**
2. Deve mostrar:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (ou vazio para auto-detecção)
   - **Output Directory**: `.next` (ou vazio para auto-detecção)
   - **Install Command**: `npm install` (ou vazio para auto-detecção)
   - **Root Directory**: `frontend` ⚠️

### 4. Se ainda não funcionar - Reconectar

**Passo a Passo Completo:**

1. **Desconectar repositório atual:**
   - Settings → Git → Scroll até o final
   - Clique em **"Disconnect"** ou **"Remove Git Repository"**
   - Confirme

2. **Conectar novamente:**
   - Clique em **"Connect Git Repository"**
   - Selecione **GitHub**
   - Autorize se necessário
   - Busque e selecione: `eedanilo/godLevel`

3. **Configurar o projeto:**
   - **Project Name**: Qualquer nome (ex: `restaurant-analytics`)
   - **Framework Preset**: `Next.js`
   - **Root Directory**: ⚠️ **IMPORTANTE** → Digite: `frontend`
   - **Build Command**: Deixe vazio (auto-detecta)
   - **Output Directory**: Deixe vazio (auto-detecta)
   - **Install Command**: Deixe vazio (auto-detecta)

4. **Configurar Environment Variables:**
   - **Settings** → **Environment Variables**
   - Adicione: `NEXT_PUBLIC_API_URL` = URL do seu backend (ex: `http://localhost:8000` para dev)

5. **Deploy:**
   - Clique em **"Deploy"**
   - Aguarde o build

### 5. Verificar Deployments

1. Vá em **Deployments**
2. Clique no deployment mais recente
3. Verifique:
   - **Commit**: Deve ser `caa76d4` ou mais recente (NÃO `90a6db1`)
   - **Branch**: `main`
   - **Build Logs**: Clique em "View Build Logs" para ver erros

## 🐛 Problemas Comuns

### Problema: Vercel mostra commit antigo (90a6db1)

**Causa**: Branch errado ou cache antigo

**Solução**:
1. Verifique se **Production Branch** está como `main`
2. Faça um **Redeploy forçado** (sem cache)
3. Ou reconecte o repositório

### Problema: Erro 404

**Causa**: Root Directory não configurado

**Solução**:
1. Configure **Root Directory** como `frontend`
2. Faça um novo deploy

### Problema: Build falha

**Causa**: Erros de TypeScript ou sintaxe

**Solução**:
1. Veja os logs do build na Vercel
2. Corrija os erros mostrados
3. Faça commit e push
4. A Vercel fará deploy automaticamente

## ✅ Checklist Final

- [ ] Repositório conectado: `eedanilo/godLevel`
- [ ] Production Branch: `main`
- [ ] Root Directory: `frontend` ⚠️
- [ ] Framework: Next.js
- [ ] Commit mais recente: `caa76d4` ou mais novo
- [ ] Environment Variables configuradas (se necessário)
- [ ] Build completo sem erros

## 📞 Se ainda não funcionar

1. **Limpe o cache da Vercel:**
   - Settings → General → Scroll até o final
   - "Clear Build Cache"

2. **Verifique o webhook no GitHub:**
   - GitHub → Settings → Webhooks
   - Deve haver um webhook da Vercel ativo

3. **Force um novo deploy:**
   ```bash
   # No terminal local
   cd /Users/danilodantez/godLevel/nola-god-level
   git commit --allow-empty -m "Force Vercel deploy"
   git push origin main
   ```

## 💡 Dica Importante

O **Root Directory** é a configuração mais crítica. Se não estiver como `frontend`, a Vercel tentará fazer build na raiz do projeto (onde não tem `package.json` do Next.js), causando erro 404 ou build falho.

