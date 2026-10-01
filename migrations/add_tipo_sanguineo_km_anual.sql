-- ============================================================================
-- Migração: Adicionar Tipo Sanguíneo e Quilometragem Anual
-- ============================================================================
-- Data: 2025-01-XX
-- Descrição: Adiciona campo tipo_sanguineo na tabela membros e cria tabela 
--            para histórico de quilometragem anual
-- ============================================================================

-- Adicionar coluna tipo_sanguineo na tabela membros
ALTER TABLE membros
ADD COLUMN IF NOT EXISTS tipo_sanguineo VARCHAR(3) 
CHECK (tipo_sanguineo IS NULL OR tipo_sanguineo IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));

-- Criar tabela para histórico de quilometragem anual
CREATE TABLE IF NOT EXISTS km_anual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES membros(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  km_total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_id, ano)
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_km_anual_member_year ON km_anual(member_id, ano);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_km_anual_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_km_anual_updated_at ON km_anual;
CREATE TRIGGER trigger_update_km_anual_updated_at
  BEFORE UPDATE ON km_anual
  FOR EACH ROW
  EXECUTE FUNCTION update_km_anual_updated_at();

-- ============================================================================
-- Notas:
-- - tipo_sanguineo é opcional (permite NULL)
-- - CHECK constraint garante apenas valores válidos de tipo sanguíneo
-- - km_anual permite histórico por ano, com UNIQUE constraint em (member_id, ano)
-- - km_total é DECIMAL para precisão nos cálculos
-- - Índice criado para melhor performance em consultas por membro e ano
-- ============================================================================

