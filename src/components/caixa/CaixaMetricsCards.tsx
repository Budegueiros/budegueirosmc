import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface CaixaMetricsCardsProps {
  metrics: {
    saldoAtual: number;
    totalEntradas: number;
    totalSaidas: number;
    pendentesRecibo: number;
  };
  onPendentesClick?: () => void;
}

export default function CaixaMetricsCards({ metrics, onPendentesClick }: CaixaMetricsCardsProps) {
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(valor);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Saldo Atual */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Saldo Atual</p>
          <p className="text-3xl font-bold text-white mb-1">
            {formatarValor(metrics.saldoAtual)}
          </p>
          <p className="text-xs text-gray-500">Entradas - Saídas</p>
        </div>
      </div>

      {/* Total Entradas */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Total Entradas</p>
          <p className="text-3xl font-bold text-white mb-1">
            {formatarValor(metrics.totalEntradas)}
          </p>
          <p className="text-xs text-gray-500">Recebimentos</p>
        </div>
      </div>

      {/* Total Saídas */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-500/10 rounded-lg">
            <TrendingDown className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Total Saídas</p>
          <p className="text-3xl font-bold text-white mb-1">
            {formatarValor(metrics.totalSaidas)}
          </p>
          <p className="text-xs text-gray-500">Pagamentos</p>
        </div>
      </div>

      {/* Pendentes de Recibo */}
      <div 
        className={`bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6 ${onPendentesClick ? 'cursor-pointer hover:border-orange-500/50 transition hover:scale-[1.02]' : ''}`}
        onClick={onPendentesClick}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-500/10 rounded-lg">
            <AlertCircle className="w-6 h-6 text-orange-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Pendentes de Recibo</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.pendentesRecibo}
          </p>
          <p className="text-xs text-gray-500">
            {onPendentesClick ? 'Clique para filtrar' : 'Sem comprovante'}
          </p>
        </div>
      </div>
    </div>
  );
}

