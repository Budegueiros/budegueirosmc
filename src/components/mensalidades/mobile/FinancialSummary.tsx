import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

interface FinancialSummaryProps {
  stats: {
    arrecadado: number;
    pendente: number;
    atrasado: number;
    pagoCount: number;
    totalCount: number;
  };
  currentMonth: string;
  currentYear: number;
}

export default function FinancialSummary({
  stats,
  currentMonth,
  currentYear,
}: FinancialSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarMes = (mesRef: string) => {
    const date = new Date(mesRef + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const totalEsperado = stats.arrecadado + stats.pendente + stats.atrasado;
  const taxaConversao = totalEsperado > 0
    ? ((stats.arrecadado / totalEsperado) * 100).toFixed(1)
    : '0.0';

  const valorMedio = stats.totalCount > 0
    ? totalEsperado / stats.totalCount
    : 0;

  // Tentar parsear o mês de diferentes formatos
  let mesFormatado = '';
  try {
    if (currentMonth.includes('-')) {
      mesFormatado = formatarMes(`${currentYear}-${String(parseInt(currentMonth.split('-')[1] || '1')).padStart(2, '0')}-01`);
    } else {
      // Se for string como "janeiro", criar data apropriada
      const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                     'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      const mesIndex = meses.findIndex(m => m.toLowerCase() === currentMonth.toLowerCase());
      if (mesIndex >= 0) {
        mesFormatado = formatarMes(`${currentYear}-${String(mesIndex + 1).padStart(2, '0')}-01`);
      } else {
        mesFormatado = `${currentMonth}/${currentYear}`;
      }
    }
  } catch {
    mesFormatado = `${currentMonth}/${currentYear}`;
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mx-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-3"
      >
        <span className="text-sm font-semibold text-gray-200">
          💰 Resumo Financeiro - {mesFormatado}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
        <div className="flex-1 flex flex-col items-center">
          <span className="text-base font-bold text-green-400 mb-1">
            {formatarValor(stats.arrecadado)}
          </span>
          <span className="text-xs text-gray-400">Arrecadado</span>
        </div>

        <div className="w-px h-8 bg-gray-700" />

        <div className="flex-1 flex flex-col items-center">
          <span className="text-base font-bold text-yellow-400 mb-1">
            {formatarValor(stats.pendente)}
          </span>
          <span className="text-xs text-gray-400">Pendente</span>
        </div>

        <div className="w-px h-8 bg-gray-700" />

        <div className="flex-1 flex flex-col items-center">
          <span className="text-base font-bold text-red-400 mb-1">
            {formatarValor(stats.atrasado)}
          </span>
          <span className="text-xs text-gray-400">Atrasado</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-300">
        <TrendingUp className="w-4 h-4 text-blue-400" />
        <span>Taxa de conversão:</span>
        <span className="font-bold text-blue-400">{taxaConversao}%</span>
        <span className="text-gray-500">
          ({stats.pagoCount}/{stats.totalCount} pagos)
        </span>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Total esperado:</span>
            <span className="text-sm font-semibold text-white">
              {formatarValor(totalEsperado)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Valor médio:</span>
            <span className="text-sm font-semibold text-white">
              {formatarValor(valorMedio)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

