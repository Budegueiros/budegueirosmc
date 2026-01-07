import { DollarSign, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface MetricsCardsProps {
  metrics: {
    totalArrecadado: number;
    totalPendente: number;
    totalAtrasado: number;
    taxaConversao: number;
  };
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(valor);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Total Arrecadado */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Total Arrecadado</p>
          <p className="text-3xl font-bold text-white mb-1">
            {formatarValor(metrics.totalArrecadado)}
          </p>
          <p className="text-xs text-gray-500">Mês atual</p>
        </div>
      </div>

      {/* Total Pendente */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Total Pendente</p>
          <p className="text-3xl font-bold text-white mb-1">
            {formatarValor(metrics.totalPendente)}
          </p>
          <p className="text-xs text-gray-500">Aguardando pagamento</p>
        </div>
      </div>

      {/* Total Atrasado */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-500/10 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Total Atrasado</p>
          <p className="text-3xl font-bold text-white mb-1">
            {formatarValor(metrics.totalAtrasado)}
          </p>
          <p className="text-xs text-gray-500">Vencidas</p>
        </div>
      </div>

      {/* Taxa de Conversão */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Taxa de Conversão</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.taxaConversao.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">Pagamentos realizados</p>
        </div>
      </div>
    </div>
  );
}

