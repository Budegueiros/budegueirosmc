import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { DollarSign, ArrowLeft, Loader2, Check, AlertCircle, Copy, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useFluxoCaixa } from '../hooks/useFluxoCaixa';
import DashboardLayout from '../components/DashboardLayout';

interface Mensalidade {
  id: string;
  mes_referencia: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  link_cobranca: string | null;
  forma_pagamento: string | null;
  observacao: string | null;
}

export default function MyPayments() {
  const { user } = useAuth();
  const { info: toastInfo } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { fluxoCaixa, loading: loadingCaixa } = useFluxoCaixa();
  
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  const carregarDados = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar ID do membro
      const { data: membroData, error: membroError } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (membroError) throw membroError;
      
      if (!membroData) {
        navigate('/complete-profile');
        return;
      }

      // Carregar mensalidades do membro
      const { data: mensalidadesData, error: mensalidadesError } = await supabase
        .from('mensalidades')
        .select('*')
        .eq('membro_id', membroData.id)
        .order('mes_referencia', { ascending: false });

      if (mensalidadesError) throw mensalidadesError;
      setMensalidades(mensalidadesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas do caixa (mesmo cálculo do ControleCaixa)
  const metricsCaixa = useMemo(() => {
    // Se fluxoCaixa ainda não foi carregado ou está vazio, retorna zeros
    if (!fluxoCaixa || fluxoCaixa.length === 0) {
      return {
        saldoAtual: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        pendentesRecibo: 0
      };
    }

    const totalEntradas = fluxoCaixa
      .filter(l => l.tipo === 'entrada')
      .reduce((acc, l) => acc + l.valor, 0);

    const totalSaidas = fluxoCaixa
      .filter(l => l.tipo === 'saida')
      .reduce((acc, l) => acc + l.valor, 0);

    const saldoAtual = totalEntradas - totalSaidas;

    const pendentesRecibo = fluxoCaixa
      .filter(l => l.tipo === 'saida' && !l.anexo_url)
      .length;

    return {
      saldoAtual,
      totalEntradas,
      totalSaidas,
      pendentesRecibo
    };
  }, [fluxoCaixa]);

  const formatarMes = (mesReferencia: string) => {
    const date = new Date(mesReferencia + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const formatarData = (data: string) => {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('T')[0].split('-');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia)).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago':
        return 'text-green-500 bg-green-950/30 border-green-600/50';
      case 'Aberto':
      case 'Pendente':
        return 'text-yellow-500 bg-yellow-950/30 border-yellow-600/50';
      case 'Atrasado':
        return 'text-red-500 bg-red-950/30 border-red-600/50';
      case 'Isento':
        return 'text-blue-500 bg-blue-950/30 border-blue-600/50';
      default:
        return 'text-gray-500 bg-gray-950/30 border-gray-600/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pago':
        return <Check className="w-4 h-4" />;
      case 'Atrasado':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const calcularResumo = () => {
    const total = mensalidades.reduce((acc, m) => acc + m.valor, 0);
    const pagas = mensalidades.filter(m => m.status === 'Pago').length;
    const pendentes = mensalidades.filter(m => m.status === 'Aberto' || m.status === 'Pendente').length;
    const atrasadas = mensalidades.filter(m => m.status === 'Atrasado').length;
    
    return { total, pagas, pendentes, atrasadas };
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(valor);
  };

  const resumo = calcularResumo();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
              Carregando...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-brand-red" />
            <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
              Minhas Mensalidades
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Acompanhe seu histórico de pagamentos
          </p>
        </div>

        {/* Resumo Mensalidades */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase mb-1">Total</p>
            <p className="text-white font-oswald text-2xl font-bold">{mensalidades.length}</p>
          </div>
          <div className="bg-brand-gray border border-green-600/30 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase mb-1">Pagas</p>
            <p className="text-green-500 font-oswald text-2xl font-bold">{resumo.pagas}</p>
          </div>
          <div className="bg-brand-gray border border-yellow-600/30 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase mb-1">Pendentes</p>
            <p className="text-yellow-500 font-oswald text-2xl font-bold">{resumo.pendentes}</p>
          </div>
          <div className="bg-brand-gray border border-red-600/30 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase mb-1">Atrasadas</p>
            <p className="text-red-500 font-oswald text-2xl font-bold">{resumo.atrasadas}</p>
          </div>
        </div>

        {/* Métricas do Caixa */}
        <div className="mb-8">
          <h2 className="text-white font-oswald text-xl uppercase font-bold mb-4">
            Controle de Caixa
          </h2>
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Saldo Atual */}
              <div className="bg-brand-gray border border-green-600/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <p className="text-gray-500 text-xs uppercase">Saldo Atual</p>
                </div>
                {loadingCaixa ? (
                  <div className="flex items-center justify-center h-8">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <p className={`font-oswald text-2xl font-bold mb-1 ${
                      metricsCaixa.saldoAtual >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatarMoeda(metricsCaixa.saldoAtual)}
                    </p>
                    <p className="text-gray-400 text-xs">Entradas - Saídas</p>
                  </>
                )}
              </div>

              {/* Total Entradas */}
              <div className="bg-brand-gray border border-blue-600/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <p className="text-gray-500 text-xs uppercase">Total Entradas</p>
                </div>
                {loadingCaixa ? (
                  <div className="flex items-center justify-center h-8">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <p className="text-blue-500 font-oswald text-2xl font-bold mb-1">
                      {formatarMoeda(metricsCaixa.totalEntradas)}
                    </p>
                    <p className="text-gray-400 text-xs">Recebimentos</p>
                  </>
                )}
              </div>

              {/* Total Saídas */}
              <div className="bg-brand-gray border border-red-600/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <p className="text-gray-500 text-xs uppercase">Total Saídas</p>
                </div>
                {loadingCaixa ? (
                  <div className="flex items-center justify-center h-8">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <p className="text-red-500 font-oswald text-2xl font-bold mb-1">
                      {formatarMoeda(metricsCaixa.totalSaidas)}
                    </p>
                    <p className="text-gray-400 text-xs">Pagamentos</p>
                  </>
                )}
              </div>

              {/* Pendentes de Recibo */}
              <div className="bg-brand-gray border border-orange-600/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <p className="text-gray-500 text-xs uppercase">Pendentes de Recibo</p>
                </div>
                {loadingCaixa ? (
                  <div className="flex items-center justify-center h-8">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <p className="text-orange-500 font-oswald text-2xl font-bold mb-1">
                      {metricsCaixa.pendentesRecibo}
                    </p>
                    <p className="text-gray-400 text-xs">Sem comprovante</p>
                  </>
                )}
              </div>
            </div>
        </div>

        {/* Lista de Mensalidades */}
        <div className="space-y-4">
          {mensalidades.length === 0 ? (
            <div className="text-center py-12 bg-brand-gray border border-brand-red/30 rounded-xl">
              <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma mensalidade cadastrada ainda.</p>
            </div>
          ) : (
            mensalidades.map((mensalidade) => (
              <div
                key={mensalidade.id}
                className="bg-brand-gray border border-brand-red/30 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-oswald text-xl uppercase font-bold">
                      {formatarMes(mensalidade.mes_referencia)}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Vencimento: {formatarData(mensalidade.data_vencimento)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-bold border ${getStatusColor(mensalidade.status)}`}>
                    {getStatusIcon(mensalidade.status)}
                    {mensalidade.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">Valor</p>
                    <p className="text-white font-oswald text-2xl font-bold">
                      R$ {mensalidade.valor.toFixed(2)}
                    </p>
                  </div>

                  {mensalidade.data_pagamento && (
                    <div>
                      <p className="text-gray-500 text-xs uppercase mb-1">Pago em</p>
                      <p className="text-green-400 font-semibold">
                        {formatarData(mensalidade.data_pagamento)}
                      </p>
                      {mensalidade.forma_pagamento && (
                        <p className="text-gray-400 text-xs mt-0.5">
                          via {mensalidade.forma_pagamento}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {mensalidade.link_cobranca && mensalidade.status !== 'Pago' && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(mensalidade.link_cobranca!);
                          toastInfo('Código PIX copiado para a área de transferência!');
                        } catch (error) {
                          console.error('Erro ao copiar:', error);
                          toastInfo('Erro ao copiar código PIX. Tente novamente.');
                        }
                      }}
                      className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar Código PIX
                    </button>
                  </div>
                )}

                {mensalidade.observacao && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-gray-500 text-xs uppercase mb-1">Observação</p>
                    <p className="text-gray-300 text-sm">{mensalidade.observacao}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
