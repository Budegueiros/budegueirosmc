# Executar Migration - Tipo Sanguíneo e KM Anual

## Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard:
   - URL: https://supabase.com/dashboard/project/qrksozrkfldqqiibyhsv
   - Ou: https://supabase.com/dashboard → Selecione o projeto

2. Vá para **SQL Editor**:
   - Menu lateral → SQL Editor → New Query

3. Copie e cole o conteúdo do arquivo `add_tipo_sanguineo_km_anual.sql`

4. Clique em **Run** ou pressione `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)

5. Verifique se a execução foi bem-sucedida (deve mostrar "Success")

## Opção 2: Via Supabase CLI (Se instalado)

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref qrksozrkfldqqiibyhsv

# Executar migration
supabase db push --file migrations/add_tipo_sanguineo_km_anual.sql
```

## Opção 3: Via psql (PostgreSQL direto)

```bash
# Conectar ao banco via psql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.qrksozrkfldqqiibyhsv.supabase.co:5432/postgres"

# Executar migration
\i migrations/add_tipo_sanguineo_km_anual.sql
```

## Verificação

Após executar a migration, verifique:

1. **Coluna tipo_sanguineo foi adicionada:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'membros' AND column_name = 'tipo_sanguineo';
   ```

2. **Tabela km_anual foi criada:**
   ```sql
   SELECT * FROM km_anual LIMIT 1;
   ```

3. **Índice foi criado:**
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'km_anual';
   ```

