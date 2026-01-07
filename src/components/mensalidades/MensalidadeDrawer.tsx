import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, FileText, Clock, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StatusBadge from './StatusBadge';
import { formatarValor, formatarData, formatarMesReferencia, calcularDiasAtraso } from '../../utils/mensalidadesHelpers';
import { useToast } from '../../contexts/ToastContext';

interface Mensalidade {
  id: string;
  membro_id: string;
  mes_referencia: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  link_cobranca: string | null;
  forma_pagamento: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string | null;
  membros: {
    nome_completo: string;
    nome_guerra: string;
    numero_carteira: string;
  };
}

interface HistoricoMensalidade {
  id: string;
  mes_referencia: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  forma_pagamento: string | null;
  created_at: string;
}

interface MensalidadeDrawerProps {
  mensalidade: Mensalidade | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function MensalidadeDrawer({ mensalidade, isOpen, onClose, onRefresh }: MensalidadeDrawerProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [historico, setHistorico] = useState<HistoricoMensalidade[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  useEffect(() => {
    if (isOpen && mensalidade) {
      carregarHistorico();
    }
  }, [isOpen, mensalidade]);

  const carregarHistorico = async () => {
    if (!mensalidade) return;

    setLoadingHistorico(true);
    try {
      const { data, error } = await supabase
        .from('mensalidades')
        .select('id, mes_referencia, valor, data_vencimento, data_pagamento, status, forma_pagamento, created_at')
        .eq('membro_id', mensalidade.membro_id)
        .order('mes_referencia', { ascending: false })
        .limit(12); // Últimos 12 meses

      if (error) throw error;
      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toastError('Erro ao carregar histórico de mensalidades');
    } finally {
      setLoadingHistorico(false);
    }
  };

  const copiarPix = async () => {
    if (!mensalidade?.link_cobranca) return;

    try {
      await navigator.clipboard.writeText(mensalidade.link_cobranca);
      toastSuccess('Código PIX copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toastError('Erro ao copiar código PIX');
    }
  };

  if (!mensalidade) return null;

  const diasAtraso = calcularDiasAtraso(mensalidade);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-gray-900 border-l border-gray-700 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {mensalidade.membros.nome_guerra}
            </h2>
            <p className="text-gray-400 text-sm">
              {mensalidade.membros.nome_completo} • Carteira: {mensalidade.membros.numero_carteira}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Detalhes da Mensalidade Atual */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes da Mensalidade
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs uppercase mb-1">Mês de Referência</p>
                <p className="text-white font-semibold capitalize">
                  {formatarMesReferencia(mensalidade.mes_referencia)}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs uppercase mb-1">Valor</p>
                <p className="text-white font-semibold text-xl">
                  {formatarValor(mensalidade.valor)}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs uppercase mb-1">Data de Vencimento</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatarData(mensalidade.data_vencimento)}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs uppercase mb-1">Status</p>
                <StatusBadge status={mensalidade.status} diasAtraso={diasAtraso > 0 ? diasAtraso : undefined} />
              </div>

              {mensalidade.data_pagamento && (
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-1">Data de Pagamento</p>
                  <p className="text-green-400 font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {formatarData(mensalidade.data_pagamento)}
                  </p>
                </div>
              )}

              {mensalidade.forma_pagamento && (
                <div>
                  <p className="text-gray-400 text-xs uppercase mb-1">Forma de Pagamento</p>
                  <p className="text-white font-semibold">{mensalidade.forma_pagamento}</p>
                </div>
              )}

              {mensalidade.link_cobranca && (
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-xs uppercase mb-2">Código PIX</p>
                  <button
                    onClick={copiarPix}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-3 text-left w-full transition group"
                  >
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs mb-1">Clique para copiar</p>
                      <p className="text-white text-sm font-mono truncate">
                        {mensalidade.link_cobranca}
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {mensalidade.observacao && (
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-xs uppercase mb-1">Observação</p>
                  <p className="text-gray-300 text-sm bg-gray-800/50 rounded-lg p-3">
                    {mensalidade.observacao}
                  </p>
                </div>
              )}

              <div className="md:col-span-2 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Criado em</p>
                    <p className="text-gray-300">
                      {new Date(mensalidade.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {mensalidade.updated_at && (
                    <div>
                      <p className="text-gray-400">Atualizado em</p>
                      <p className="text-gray-300">
                        {new Date(mensalidade.updated_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Mensalidades */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico de Mensalidades
            </h3>

            {loadingHistorico ? (
              <div className="text-center py-8 text-gray-400">Carregando histórico...</div>
            ) : historico.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Nenhum histórico encontrado</div>
            ) : (
              <div className="space-y-3">
                {historico.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-gray-900 border rounded-lg p-4 transition ${
                      item.id === mensalidade.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-white font-semibold capitalize">
                          {formatarMesReferencia(item.mes_referencia)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Vencimento: {formatarData(item.data_vencimento)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{formatarValor(item.valor)}</p>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                    {item.data_pagamento && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <p className="text-green-400 text-sm flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Pago em {formatarData(item.data_pagamento)}
                          {item.forma_pagamento && ` • ${item.forma_pagamento}`}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

