# 🔧 Como Verificar e Configurar o Branch na Vercel

## 📍 Verificar Branch no Git (Local)

No terminal, você pode verificar qual branch está ativo:

```bash
cd /Users/danilodantez/godLevel/nola-god-level
git branch
```

Isso mostra o branch atual (geralmente `* main` se você estiver no main).

Para ver o branch remoto configurado:

```bash
git remote show origin
```

Isso mostra qual branch está configurado como padrão no GitHub.

## 🌐 Verificar e Configurar Branch na Vercel

### Passo 1: Acessar Configurações do Projeto

1. Acesse [vercel.com](https://vercel.com)
2. Faça login na sua conta
3. Clique no projeto `godLevel` (ou o nome do seu projeto)

### Passo 2: Verificar Branch nas Configurações

1. Clique em **"Settings"** (Configurações) no topo
2. Vá para **"Git"** no menu lateral esquerdo
3. Procure por **"Production Branch"** ou **"Branch"**
4. Você verá qual branch está configurado (deve ser `main`)

### Passo 3: Configurar Branch como `main`

Se não estiver configurado como `main`:

1. Na seção **"Git"** > **"Production Branch"**
2. Clique em **"Edit"** ou **"Change"**
3. Selecione ou digite: `main`
4. Clique em **"Save"**

### Passo 4: Verificar Deployments

Para ver qual commit está sendo usado:

1. Vá para a aba **"Deployments"** no topo
2. Veja o deployment mais recente
3. Clique nele para ver detalhes
4. Procure por **"Commit"** ou **"Git Commit"**
5. Deve mostrar algo como: `Commit: c060959` (ou o hash do commit mais recente)

### Passo 5: Verificar se está Usando o Commit Correto

O commit mais recente deve ser:
- `c060959` - Trigger deploy Vercel - corrigir build errors (mais recente)
- `8f2c9e2` - Corrigir erro de TypeScript no CorrelationAnalysisPanel
- `024f591` - Corrigir erro de sintaxe no TrendForecastPanel.tsx

**Se a Vercel ainda mostrar o commit `90a6db1`**, significa que:
1. A Vercel está usando um branch diferente
2. A Vercel está usando cache antigo
3. O repositório conectado está errado

## 🔄 Como Forçar a Vercel a Usar o Branch Correto

### Opção 1: Recriar Conexão do Repositório

1. Na Vercel, vá em **Settings > Git**
2. Clique em **"Disconnect"** (desconectar)
3. Clique em **"Connect Git Repository"**
4. Selecione seu repositório: `eedanilo/godLevel`
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Production Branch**: `main`
6. Clique em **"Deploy"**

### Opção 2: Fazer Redeploy Forçado

1. Vá em **"Deployments"**
2. Clique nos três pontos (⋮) no deployment mais recente
3. Selecione **"Redeploy"**
4. Marque a opção **"Use existing Build Cache"** como **desmarcada** (para forçar rebuild)
5. Clique em **"Redeploy"**

### Opção 3: Verificar Webhook do GitHub

1. No GitHub, vá para o repositório: https://github.com/eedanilo/godLevel
2. Clique em **Settings** > **Webhooks**
3. Verifique se há um webhook da Vercel configurado
4. Certifique-se de que o webhook está ativo e apontando para o branch `main`

## ✅ Checklist para Verificar

- [ ] Branch local está como `main`: `git branch` mostra `* main`
- [ ] Último commit está no GitHub: `git log --oneline | head -1`
- [ ] Vercel está configurado com Production Branch = `main`
- [ ] Vercel está conectada ao repositório correto: `eedanilo/godLevel`
- [ ] Último deployment na Vercel mostra o commit mais recente (não `90a6db1`)
- [ ] Root Directory na Vercel está como `frontend`

## 🐛 Se Ainda Mostrar Commit Antigo

Se após verificar tudo, a Vercel ainda mostrar o commit antigo (`90a6db1`):

1. **Desconecte e reconecte o repositório** na Vercel
2. **Limpe o cache** na Vercel (Settings > General > Clear Build Cache)
3. **Faça um novo push** forçado:
   ```bash
   git push origin main --force
   ```
   (⚠️ Cuidado: use `--force` apenas se tiver certeza!)

## 📝 Verificar no GitHub

Você também pode verificar qual commit está no GitHub:

1. Acesse: https://github.com/eedanilo/godLevel
2. Verifique o branch `main`
3. O commit mais recente deve ser `c060959` (Trigger deploy Vercel)
4. Se não for, faça push:
   ```bash
   git push origin main
   ```

