#!/usr/bin/env node

/**
 * Script para executar migration no Supabase via API
 * 
 * NOTA: Este script requer SERVICE_ROLE_KEY para executar operações DDL
 * 
 * Para obter a service role key:
 * 1. Acesse: https://supabase.com/dashboard/project/qrksozrkfldqqiibyhsv/settings/api
 * 2. Copie a "service_role" key (NÃO a anon key!)
 * 3. Execute: SERVICE_ROLE_KEY=sua_key_aqui node scripts/execute-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const SUPABASE_URL = 'https://qrksozrkfldqqiibyhsv.supabase.co';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ ERRO: SERVICE_ROLE_KEY não encontrada!');
  console.log('\n📋 Para executar este script:');
  console.log('   1. Acesse: https://supabase.com/dashboard/project/qrksozrkfldqqiibyhsv/settings/api');
  console.log('   2. Copie a "service_role" key');
  console.log('   3. Execute: SERVICE_ROLE_KEY=sua_key node scripts/execute-migration.mjs\n');
  console.log('⚠️  ALTERNATIVA: Execute diretamente no Supabase Dashboard SQL Editor');
  console.log('   URL: https://supabase.com/dashboard/project/qrksozrkfldqqiibyhsv/sql/new\n');
  process.exit(1);
}

const migrationFile = join(projectRoot, 'migrations', 'add_tipo_sanguineo_km_anual.sql');

try {
  console.log('📖 Lendo arquivo de migration...');
  const sql = readFileSync(migrationFile, 'utf-8');
  
  console.log('🔌 Conectando ao Supabase...');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Dividir o SQL em statements individuais
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Executando ${statements.length} statement(s)...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim().length === 0) continue;

    console.log(`⚙️  Executando statement ${i + 1}/${statements.length}...`);
    
    try {
      // Para operações DDL, precisamos usar rpc ou execução direta
      // O cliente Supabase JS não suporta DDL diretamente via query
      // Vamos tentar usar a API REST diretamente
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: statement + ';' })
      });

      if (!response.ok) {
        // Se não houver função RPC, vamos tentar método alternativo
        console.log('⚠️  Método RPC não disponível. Tente executar no Dashboard.\n');
        console.log('SQL para executar manualmente:');
        console.log('='.repeat(80));
        console.log(sql);
        console.log('='.repeat(80));
        process.exit(1);
      }

      const result = await response.json();
      console.log(`✅ Statement ${i + 1} executado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao executar statement ${i + 1}:`, error.message);
      console.log('\n⚠️  O Supabase client não suporta execução direta de DDL.');
      console.log('📋 Execute a migration manualmente no Dashboard:');
      console.log('   https://supabase.com/dashboard/project/qrksozrkfldqqiibyhsv/sql/new\n');
      console.log('SQL completo:');
      console.log('='.repeat(80));
      console.log(sql);
      console.log('='.repeat(80));
      process.exit(1);
    }
  }

  console.log('\n✅ Migration executada com sucesso!');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

