-- ============================================================================
-- Migração: Adicionar campo nome_guerra nas tabelas conjuges e filhos
-- ============================================================================
-- Data: 2025-01-XX
-- Descrição: Adiciona campo opcional nome_guerra para cônjuges e filhos
-- ============================================================================

-- Adicionar coluna nome_guerra na tabela conjuges
ALTER TABLE conjuges
ADD COLUMN IF NOT EXISTS nome_guerra TEXT;

-- Adicionar coluna nome_guerra na tabela filhos
ALTER TABLE filhos
ADD COLUMN IF NOT EXISTS nome_guerra TEXT;

-- ============================================================================
-- Notas:
-- - O campo é opcional (permite NULL)
-- - Tipo TEXT permite strings de qualquer tamanho
-- - IF NOT EXISTS garante que não haverá erro se a coluna já existir
-- ============================================================================


