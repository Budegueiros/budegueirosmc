-- ============================================================================
-- Migração: Reforça validação de duplicidade por evento para clubes presentes
-- ============================================================================
-- Data: 2026-04-12
-- Descrição: Bloqueia duplicidade por telefone no mesmo evento e expõe uma
--            função pública segura para validar se o clube já retirou troféu
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_clubes_presentes_evento_whatsapp
  ON clubes_presentes_eventos (evento_id, whatsapp);

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
