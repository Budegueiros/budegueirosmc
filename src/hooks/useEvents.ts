import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface Evento {
  id: string;
  nome: string;
  tipo_evento: string;
  data_evento: string;
  hora_saida: string | null;
  local_saida: string;
  local_destino: string | null;
  cidade: string;
  estado: string;
  status: string;
  max_participantes: number | null;
  vagas_limitadas: boolean;
}

interface EventoComConfirmados extends Evento {
  confirmados: number;
  budegueiras: number;
  visitantes: number;
  totalMembros: number;
  usuarioConfirmou: boolean;
}

interface UseEventsReturn {
  eventos: Evento[];
  eventosComConfirmados: EventoComConfirmados[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEvents(userId?: string): UseEventsReturn {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmadosMap, setConfirmadosMap] = useState<Record<string, number>>({});
  const [budegueirasMap, setBudegueirasMap] = useState<Record<string, number>>({});
  const [visitantesMap, setVisitantesMap] = useState<Record<string, number>>({});
  const [usuarioConfirmacoes, setUsuarioConfirmacoes] = useState<Set<string>>(new Set());
  const [totalMembros, setTotalMembros] = useState(0);

  const carregarEventos = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar eventos
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos')
        .select('*')
        .order('data_evento', { ascending: false });

      if (eventosError) throw eventosError;
      setEventos(eventosData || []);

      // Buscar total de membros ativos
      const { count: membrosCount } = await supabase
        .from('membros')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      setTotalMembros(membrosCount || 0);

      // Buscar confirmações de presença para todos os eventos
      if (eventosData && eventosData.length > 0) {
        const eventIds = eventosData.map(e => e.id);
        const confirmados: Record<string, number> = {};
        const budegueiras: Record<string, number> = {};
        const visitantes: Record<string, number> = {};

        await Promise.all(
          eventIds.map(async (eventId) => {
            const { data: confirmacoesData } = await supabase
              .from('confirmacoes_presenca')
              .select('vai_com_budegueira, quantidade_visitantes')
              .eq('evento_id', eventId)
              .eq('status', 'Confirmado');

            confirmados[eventId] = confirmacoesData?.length || 0;
            budegueiras[eventId] = (confirmacoesData || []).filter(c => c.vai_com_budegueira).length;
            visitantes[eventId] = (confirmacoesData || []).reduce((acc, c) => acc + (c.quantidade_visitantes || 0), 0);
          })
        );

        setConfirmadosMap(confirmados);
        setBudegueirasMap(budegueiras);
        setVisitantesMap(visitantes);

        // Buscar confirmações do usuário atual (se logado)
        if (userId) {
          const { data: membroData } = await supabase
            .from('membros')
            .select('id')
            .eq('user_id', userId)
            .single();

          if (membroData) {
            const { data: confirmacoesData } = await supabase
              .from('confirmacoes_presenca')
              .select('evento_id')
              .eq('membro_id', membroData.id)
              .eq('status', 'Confirmado');

            const confirmacoesSet = new Set(
              (confirmacoesData || []).map(c => c.evento_id)
            );
            setUsuarioConfirmacoes(confirmacoesSet);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
      setError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const eventosComConfirmados = useMemo(() => {
    return eventos.map(evento => ({
      ...evento,
      confirmados: confirmadosMap[evento.id] || 0,
      budegueiras: budegueirasMap[evento.id] || 0,
      visitantes: visitantesMap[evento.id] || 0,
      totalMembros: evento.vagas_limitadas && evento.max_participantes 
        ? evento.max_participantes 
        : totalMembros,
      usuarioConfirmou: usuarioConfirmacoes.has(evento.id)
    }));
  }, [eventos, confirmadosMap, budegueirasMap, visitantesMap, totalMembros, usuarioConfirmacoes]);

  return {
    eventos,
    eventosComConfirmados,
    loading,
    error,
    refresh: carregarEventos
  };
}
