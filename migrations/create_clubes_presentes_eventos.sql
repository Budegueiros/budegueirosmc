-- ============================================================================
-- Migração: Criar tabela de registro de Moto Clubes presentes em eventos
-- ============================================================================
-- Data: 2026-04-12
-- Descrição: Armazena os check-ins de Moto Clubes/Moto Grupos por evento
-- ============================================================================

CREATE TABLE IF NOT EXISTS clubes_presentes_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  nome_clube TEXT NOT NULL,
  representante_presente TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado CHAR(2) NOT NULL,
  whatsapp TEXT NOT NULL,
  integrantes_presentes INTEGER NOT NULL CHECK (integrantes_presentes BETWEEN 1 AND 500),
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clubes_presentes_estado_uf_valida CHECK (estado ~ '^[A-Z]{2}$')
);

-- Evita registro duplicado do mesmo clube no mesmo evento (comparação case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_clubes_presentes_evento_nome_normalizado
  ON clubes_presentes_eventos (evento_id, lower(trim(nome_clube)));

CREATE UNIQUE INDEX IF NOT EXISTS uq_clubes_presentes_evento_whatsapp
  ON clubes_presentes_eventos (evento_id, whatsapp);

CREATE INDEX IF NOT EXISTS idx_clubes_presentes_evento_id
  ON clubes_presentes_eventos (evento_id);

CREATE INDEX IF NOT EXISTS idx_clubes_presentes_registrado_em
  ON clubes_presentes_eventos (registrado_em DESC);

-- Trigger para manter updated_at sincronizado
CREATE OR REPLACE FUNCTION update_clubes_presentes_eventos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_clubes_presentes_eventos_updated_at ON clubes_presentes_eventos;
CREATE TRIGGER trigger_update_clubes_presentes_eventos_updated_at
  BEFORE UPDATE ON clubes_presentes_eventos
  FOR EACH ROW
  EXECUTE FUNCTION update_clubes_presentes_eventos_updated_at();

-- RLS para manter o acesso controlado
ALTER TABLE clubes_presentes_eventos ENABLE ROW LEVEL SECURITY;

-- Inserção liberada para check-in no local (rota pública)
CREATE POLICY "clubes_presentes_insert_public"
  ON clubes_presentes_eventos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Consulta restrita a usuários autenticados
CREATE POLICY "clubes_presentes_select_authenticated"
  ON clubes_presentes_eventos
  FOR SELECT
  TO authenticated
  USING (true);

-- Edição e remoção restritas a usuários autenticados
CREATE POLICY "clubes_presentes_update_authenticated"
  ON clubes_presentes_eventos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clubes_presentes_delete_authenticated"
  ON clubes_presentes_eventos
  FOR DELETE
  TO authenticated
  USING (true);

GRANT INSERT ON TABLE clubes_presentes_eventos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE clubes_presentes_eventos TO authenticated;

CREATE OR REPLACE FUNCTION verificar_duplicidade_clube_evento(
  p_evento_id UUID,
  p_nome_clube TEXT,
  p_whatsapp TEXT
)
RETURNS TABLE (
  id UUID,
  nome_clube TEXT,
  representante_presente TEXT,
  whatsapp TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome_normalizado TEXT := lower(trim(regexp_replace(coalesce(p_nome_clube, ''), '\s+', ' ', 'g')));
  v_whatsapp_normalizado TEXT := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nome_clube,
    c.representante_presente,
    c.whatsapp
  FROM clubes_presentes_eventos c
  WHERE c.evento_id = p_evento_id
    AND (
      c.whatsapp = v_whatsapp_normalizado
      OR lower(trim(regexp_replace(c.nome_clube, '\s+', ' ', 'g'))) = v_nome_normalizado
    )
  ORDER BY
    CASE WHEN c.whatsapp = v_whatsapp_normalizado THEN 0 ELSE 1 END,
    c.registrado_em ASC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION verificar_duplicidade_clube_evento(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verificar_duplicidade_clube_evento(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- Notas:
-- - Um mesmo clube só pode ser registrado uma vez por evento
-- - O campo estado exige UF com 2 letras maiúsculas
-- - A tabela está preparada para integração com o formulário CadastroClubes
-- ============================================================================
