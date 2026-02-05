/**
 * Hook customizado para carregar todos os dados do Dashboard
 * Centraliza a lógica de busca e transformação de dados
 */
import { useState, useEffect, useCallback } from 'react';
import { membroService } from '../services/membroService';
import { motoService, MotoData } from '../services/motoService';
import { eventoService } from '../services/eventoService';
import { mensalidadeService, MensalidadeData } from '../services/mensalidadeService';
import { MembroComCargos } from '../types/database.types';
import { Evento } from '../types/database.types';
import { handleSupabaseError, logError } from '../utils/errorHandler';

interface UseDashboardDataReturn {
  membro: MembroComCargos | null;
  motos: MotoData[];
  proximoEvento: Evento | null;
  mensalidades: MensalidadeData[];
  mensalidadesAtrasadas: MensalidadeData[];
  kmAnual: number;
  confirmados: number;
  confirmacaoId: string | null;
  loading: boolean;
  error: string | null;
  confirmarPresenca: (detalhes?: { vaiComBudegueira: boolean; quantidadeVisitantes: number }) => Promise<void>;
  confirmandoPresenca: boolean;
  recarregar: () => Promise<void>;
}

/**
 * Hook para carregar todos os dados necessários para o Dashboard
 */
export function useDashboardData(userId: string | undefined): UseDashboardDataReturn {
  const [membro, setMembro] = useState<MembroComCargos | null>(null);
  const [motos, setMotos] = useState<MotoData[]>([]);
  const [proximoEvento, setProximoEvento] = useState<Evento | null>(null);
  const [mensalidades, setMensalidades] = useState<MensalidadeData[]>([]);
  const [mensalidadesAtrasadas, setMensalidadesAtrasadas] = useState<MensalidadeData[]>([]);
  const [kmAnual, setKmAnual] = useState<number>(0);
  const [confirmados, setConfirmados] = useState<number>(0);
  const [confirmacaoId, setConfirmacaoId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoPresenca, setConfirmandoPresenca] = useState<boolean>(false);

  const carregarDados = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar membro
      const membroData = await membroService.buscarPorUserId(userId);
      
      if (!membroData) {
        setLoading(false);
        return;
      }

      setMembro(membroData);

      // Buscar dados relacionados em paralelo
      const [motosData, proximoEventoData, mensalidadesData, kmAnualData] = await Promise.all([
        motoService.buscarPorMembroId(membroData.id),
        eventoService.buscarProximoEvento(),
        mensalidadeService.buscarPorMembroId(membroData.id),
        eventoService.calcularKmAnual(membroData.id),
      ]);

      setMotos(motosData);
      setProximoEvento(proximoEventoData);
      setMensalidades(mensalidadesData);
      setKmAnual(kmAnualData);

      // Filtrar mensalidades atrasadas
      const atrasadas = mensalidadeService.filtrarAtrasadas(mensalidadesData);
      setMensalidadesAtrasadas(atrasadas);

      // Se há próximo evento, buscar dados de confirmação
      if (proximoEventoData) {
        const [confirmadosCount, minhaConfirmacao] = await Promise.all([
          eventoService.contarConfirmados(proximoEventoData.id),
          eventoService.verificarConfirmacao(membroData.id, proximoEventoData.id),
        ]);

        setConfirmados(confirmadosCount);
        setConfirmacaoId(minhaConfirmacao);
      } else {
        setConfirmados(0);
        setConfirmacaoId(null);
      }
    } catch (err) {
      const appError = handleSupabaseError(err);
      // Evitar atualizar error se já está definido para evitar loop
      setError((prevError) => prevError || appError.message);
      logError(appError, { userId });
      console.error('Erro ao carregar dados do Dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Carregar dados quando userId mudar
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Função para confirmar/cancelar presença
  const confirmarPresenca = useCallback(async (detalhes?: { vaiComBudegueira: boolean; quantidadeVisitantes: number }) => {
    if (!membro || !proximoEvento || confirmandoPresenca) return;

    setConfirmandoPresenca(true);

    try {
      const resultado = await eventoService.toggleConfirmacaoPresenca(
        membro.id,
        proximoEvento.id,
        confirmacaoId,
        detalhes
      );

      // Atualizar estado baseado no resultado
      if (resultado.action === 'created') {
        setConfirmacaoId(resultado.id);
        setConfirmados((prev) => prev + 1);
      } else {
        setConfirmacaoId(null);
        setConfirmados((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      const appError = handleSupabaseError(err);
      logError(appError, { membroId: membro?.id, eventoId: proximoEvento?.id });
      throw appError; // Re-throw para que o componente possa tratar (ex: toast)
    } finally {
      setConfirmandoPresenca(false);
    }
  }, [membro, proximoEvento, confirmacaoId, confirmandoPresenca]);

  return {
    membro,
    motos,
    proximoEvento,
    mensalidades,
    mensalidadesAtrasadas,
    kmAnual,
    confirmados,
    confirmacaoId,
    loading,
    error,
    confirmarPresenca,
    confirmandoPresenca,
    recarregar: carregarDados,
  };
}
