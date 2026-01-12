# 🔴 SOLUÇÃO: Erro "Invalid API key" em Produção

## 📋 Problema Identificado

O diagnóstico mostra:
```
❌ Erro de conexão: Invalid API key
```

Isso significa que a `VITE_SUPABASE_ANON_KEY` configurada no AWS Amplify está **incorreta** ou **desatualizada**.

## ✅ Solução Passo a Passo

### Passo 1: Obter a Chave Correta do Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto: `qrksozrkfldqqiibyhsv`
3. Vá em **Settings** → **API**
4. Na seção **Project API keys**, encontre a chave **`anon` `public`**
5. **Copie a chave completa** (é uma string longa, tipo JWT)

### Passo 2: Atualizar no AWS Amplify

1. Acesse o [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Selecione o app **budegueirosmc**
3. Vá em **App settings** → **Environment variables**
4. Encontre a variável `VITE_SUPABASE_ANON_KEY`
5. Clique em **Editar**
6. **Cole a chave correta** que você copiou do Supabase
7. Clique em **Salvar**

### Passo 3: Verificar Outras Configurações

Enquanto está no Supabase Dashboard, também configure:

#### URLs de Redirecionamento

1. No Supabase Dashboard, vá em **Settings** → **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL:** `https://budegueirosmc.com`
   - **Redirect URLs:** Adicione:
     ```
     https://budegueirosmc.com
     https://budegueirosmc.com/*
     https://budegueirosmc.com/dashboard
     https://budegueirosmc.com/login
     ```

### Passo 4: Fazer Novo Deploy

**IMPORTANTE:** Após atualizar a chave API, você **DEVE** fazer um novo deploy:

1. No AWS Amplify, vá em **Deployments**
2. Clique em **Redeploy** no último deploy
3. Aguarde o build completar (pode levar alguns minutos)

### Passo 5: Verificar

Após o deploy:

1. Acesse `https://budegueirosmc.com/login`
2. Abra o Console (F12)
3. Execute novamente: `diagnoseProduction()`
4. Agora deve mostrar: `✅ Conexão com Supabase: OK`
5. Tente fazer login

## 🔍 Como Verificar se a Chave Está Correta

### Formato da Chave

A chave `anon` do Supabase:
- É uma string JWT (JSON Web Token)
- Começa com `eyJ...`
- Tem aproximadamente 200+ caracteres
- Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFya3NvenJrZmxkcXFpaWJ5aHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTY1MDAsImV4cCI6MjA4MjQ5MjUwMH0.Q1ffBoKmnEKJA_XGU_0dddZ0MafnGzhJVG6S7f2dKow`

### Verificação Rápida

No console do navegador em produção, execute:

```javascript
// Verificar comprimento da chave
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log('Chave configurada:', key ? 'SIM' : 'NÃO');
console.log('Comprimento:', key ? key.length : 0);
console.log('Começa com eyJ:', key ? key.startsWith('eyJ') : false);
```

Se a chave:
- ❌ Não existe → Não está configurada
- ❌ Muito curta (< 100 caracteres) → Provavelmente incorreta
- ❌ Não começa com `eyJ` → Formato incorreto

## ⚠️ Possíveis Causas

1. **Chave rotacionada no Supabase**
   - Se você rotacionou as chaves no Supabase, precisa atualizar no Amplify

2. **Chave copiada incorretamente**
   - Pode ter espaços extras ou caracteres faltando
   - Certifique-se de copiar a chave completa

3. **Chave de outro projeto**
   - Verifique se está usando a chave do projeto correto
   - Projeto: `qrksozrkfldqqiibyhsv`

4. **Chave antiga/expirada**
   - Chaves do Supabase não expiram, mas podem ser rotacionadas
   - Verifique se está usando a chave atual

## 📝 Checklist

- [ ] Acessei o Supabase Dashboard
- [ ] Copiei a chave `anon public` correta
- [ ] Atualizei `VITE_SUPABASE_ANON_KEY` no AWS Amplify
- [ ] Configurei URLs de redirecionamento no Supabase
- [ ] Fiz um novo deploy no AWS Amplify
- [ ] Testei o diagnóstico novamente
- [ ] Testei o login

## 🆘 Se Ainda Não Funcionar

1. **Verifique se há múltiplas chaves:**
   - No Supabase, pode haver chaves antigas e novas
   - Use sempre a chave `anon public` mais recente

2. **Limpe o cache do navegador:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

3. **Verifique os logs do Supabase:**
   - Supabase Dashboard → Logs → API Logs
   - Procure por erros relacionados à chave API

4. **Compare com localhost:**
   - Verifique qual chave está no seu `.env.local`
   - Compare com a chave no Amplify

## ✅ Resultado Esperado

Após corrigir, o diagnóstico deve mostrar:

```
✅ VITE_SUPABASE_ANON_KEY: Configurada
✅ Conexão com Supabase: OK
✅ Nenhum problema encontrado na configuração
```

E o login deve funcionar normalmente!
