import { BarChart3, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface EnquetesMetricsCardsProps {
  metrics: {
    total: number;
    ativas: number;
    finalizadas: number;
    taxaParticipacao: number;
  };
}

export default function EnquetesMetricsCards({ metrics }: EnquetesMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Total */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Total de Enquetes</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.total}
          </p>
          <p className="text-xs text-gray-500">Todas as enquetes</p>
        </div>
      </div>

      {/* Ativas */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Enquetes Ativas</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.ativas}
          </p>
          <p className="text-xs text-gray-500">Em andamento</p>
        </div>
      </div>

      {/* Finalizadas */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-gray-500/10 rounded-lg">
            <XCircle className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Enquetes Finalizadas</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.finalizadas}
          </p>
          <p className="text-xs text-gray-500">Encerradas</p>
        </div>
      </div>

      {/* Taxa de Participação */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Taxa de Participação</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.taxaParticipacao.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">Média de votos</p>
        </div>
      </div>
    </div>
  );
}


