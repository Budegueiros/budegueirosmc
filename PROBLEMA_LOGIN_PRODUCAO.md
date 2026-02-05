# 🔴 Problema: Login funciona no localhost mas não em produção

## 📋 Situação

- ✅ Login funciona em `localhost`
- ❌ Login **NÃO funciona** em `budegueirosmc.com`
- Erro: `401 (Unauthorized)`

## 🔍 Causas Possíveis

### 1. Variáveis de Ambiente Não Configuradas em Produção

**Problema:** As variáveis de ambiente podem não estar sendo injetadas corretamente no build de produção.

**Solução:**
1. Acesse o [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Vá em **App settings** → **Environment variables**
3. Verifique se estão configuradas:
   - `VITE_SUPABASE_URL` = `https://qrksozrkfldqqiibyhsv.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (sua chave anônima)
4. **IMPORTANTE:** Faça um novo deploy após verificar/adicionar as variáveis

### 2. URLs de Redirecionamento Não Configuradas no Supabase

**Problema:** O Supabase precisa ter a URL de produção configurada nas URLs permitidas.

**Solução:**
1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Settings** → **Authentication** → **URL Configuration**
4. Adicione nas **Site URL** e **Redirect URLs**:
   - `https://budegueirosmc.com`
   - `https://budegueirosmc.com/*`
   - `https://www.budegueirosmc.com` (se usar www)
   - `https://www.budegueirosmc.com/*`

### 3. Build Antigo Sem Variáveis

**Problema:** O build atual pode ter sido criado antes das variáveis serem configuradas.

**Solução:**
1. No AWS Amplify, vá em **Deployments**
2. Clique em **Redeploy** no último deploy
3. Ou faça um commit vazio:
   ```bash
   git commit --allow-empty -m "fix: forçar novo deploy com variáveis de ambiente"
   git push
   ```

### 4. Problemas com Cookies/localStorage

**Problema:** Em HTTPS, cookies precisam ter flags `Secure` e `SameSite`.

**Solução:** O Supabase SDK já gerencia isso, mas verifique:
- Se o site está usando HTTPS (obrigatório)
- Se não há bloqueadores de cookies/rastreamento ativos

### 5. Chave API Diferente ou Incorreta

**Problema:** A chave API em produção pode estar diferente da de desenvolvimento.

**Solução:**
1. Verifique no Supabase Dashboard → **Settings** → **API**
2. Compare a chave `anon public` com a configurada no AWS Amplify
3. Se diferente, atualize no Amplify e faça novo deploy

### 6. CORS Não Configurado

**Problema:** O Supabase pode estar bloqueando requisições do domínio de produção.

**Solução:**
1. No Supabase Dashboard → **Settings** → **API**
2. Verifique se `budegueirosmc.com` está nas origens permitidas
3. Ou configure CORS globalmente

## 🧪 Como Diagnosticar

### No Console do Navegador (F12) em Produção

Execute no console do site em produção:

```javascript
// Diagnóstico completo de produção
diagnoseProduction()

// Verificar configuração do Supabase
diagnoseSupabase()
```

### Verificar Variáveis de Ambiente no Build

1. Abra o site em produção
2. Abra o Console (F12)
3. Execute:
   ```javascript
   console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
   ```

Se mostrar `undefined` ou valores placeholder, as variáveis não estão configuradas.

## ✅ Checklist de Verificação

- [ ] Variáveis de ambiente configuradas no AWS Amplify
- [ ] Novo deploy feito após configurar variáveis
- [ ] URLs de redirecionamento configuradas no Supabase
- [ ] Site URL configurada no Supabase
- [ ] Chave API está correta e atualizada
- [ ] Build de produção foi atualizado recentemente
- [ ] Site está usando HTTPS
- [ ] Não há erros no console do navegador
- [ ] Usuário existe no banco de dados do Supabase

## 🔧 Solução Passo a Passo

### Passo 1: Verificar Variáveis no AWS Amplify

1. Acesse [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Selecione o app `budegueirosmc`
3. Vá em **App settings** → **Environment variables**
4. Verifique:
   ```
   VITE_SUPABASE_URL = https://qrksozrkfldqqiibyhsv.supabase.co
   VITE_SUPABASE_ANON_KEY = (sua chave)
   ```

### Passo 2: Configurar URLs no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Settings** → **Authentication** → **URL Configuration**
4. Configure:
   - **Site URL:** `https://budegueirosmc.com`
   - **Redirect URLs:** Adicione:
     - `https://budegueirosmc.com`
     - `https://budegueirosmc.com/*`
     - `https://budegueirosmc.com/dashboard`
     - `https://budegueirosmc.com/login`

### Passo 3: Fazer Novo Deploy

No AWS Amplify:
1. Vá em **Deployments**
2. Clique em **Redeploy** no último deploy
3. Aguarde o build completar

### Passo 4: Testar

1. Acesse `https://budegueirosmc.com/login`
2. Abra o Console (F12)
3. Execute `diagnoseProduction()`
4. Tente fazer login
5. Verifique erros no console

## 📝 Notas Importantes

- ⚠️ Variáveis de ambiente são injetadas **durante o build**, não em runtime
- 🔄 Sempre faça um **novo deploy** após alterar variáveis de ambiente
- 🔐 A chave `anon` é pública, mas deve estar correta
- 🌐 URLs de redirecionamento devem incluir o protocolo `https://`
- ✅ O Supabase SDK gerencia cookies automaticamente em HTTPS

## 🆘 Se Ainda Não Funcionar

1. Verifique os logs do Supabase:
   - Supabase Dashboard → **Logs** → **Auth Logs**
   - Procure por erros relacionados ao login

2. Verifique o Network tab no navegador:
   - Abra DevTools → **Network**
   - Tente fazer login
   - Veja a requisição para `/auth/v1/token`
   - Verifique o status code e a resposta

3. Compare com localhost:
   - Execute `diagnoseProduction()` em ambos os ambientes
   - Compare as diferenças

4. Verifique se há diferenças na configuração do Supabase Auth:
   - Settings → Authentication → Providers
   - Verifique se Email está habilitado
