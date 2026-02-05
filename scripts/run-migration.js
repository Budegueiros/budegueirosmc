#!/usr/bin/env node

/**
 * Script para executar migrations no Supabase
 * 
 * Como as operações DDL (ALTER TABLE, CREATE TABLE) requerem permissões
 * administrativas, este script exibe o SQL que deve ser executado no
 * Supabase Dashboard SQL Editor.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const migrationFile = join(projectRoot, 'migrations', 'add_tipo_sanguineo_km_anual.sql');

try {
  const sql = readFileSync(migrationFile, 'utf-8');
  
  console.log('='.repeat(80));
  console.log('MIGRATION SQL - ADICIONAR TIPO SANGUÍNEO E KM ANUAL');
  console.log('='.repeat(80));
  console.log('\n');
  console.log('⚠️  IMPORTANTE: Execute este SQL no Supabase Dashboard SQL Editor');
  console.log('   URL: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new\n');
  console.log('='.repeat(80));
  console.log('\n');
  console.log(sql);
  console.log('\n');
  console.log('='.repeat(80));
  console.log('\n✅ SQL gerado com sucesso! Copie e cole no Supabase Dashboard.\n');
  
} catch (error) {
  console.error('❌ Erro ao ler arquivo de migration:', error.message);
  process.exit(1);
}

