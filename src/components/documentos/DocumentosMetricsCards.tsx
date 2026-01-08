import { FileText, Download, EyeOff, TrendingUp } from 'lucide-react';

interface DocumentosMetricsCardsProps {
  metrics: {
    total: number;
    acessados: number;
    pendentes: number;
    taxaEngajamento: number;
  };
}

export default function DocumentosMetricsCards({ metrics }: DocumentosMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Total */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Total de Documentos</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.total}
          </p>
          <p className="text-xs text-gray-500">Todos os documentos</p>
        </div>
      </div>

      {/* Acessados */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <Download className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Total Acessados</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.acessados}
          </p>
          <p className="text-xs text-gray-500">Documentos acessados</p>
        </div>
      </div>

      {/* Pendentes */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <EyeOff className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Pendentes</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.pendentes}
          </p>
          <p className="text-xs text-gray-500">Não acessados</p>
        </div>
      </div>

      {/* Taxa de Engajamento */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Taxa de Engajamento</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.taxaEngajamento.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">Média de acesso</p>
        </div>
      </div>
    </div>
  );
}

