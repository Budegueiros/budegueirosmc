import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CaixaSummaryProps {
  balance: number;
  entradas: number;
  saidas: number;
  pendentes: number;
  period: string;
  counts?: {
    entradas: number;
    saidas: number;
  };
}

export default function CaixaSummary({
  balance,
  entradas,
  saidas,
  pendentes,
  period,
  counts,
}: CaixaSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const ticketMedioEntradas = counts && counts.entradas > 0 ? entradas / counts.entradas : 0;
  const ticketMedioSaidas = counts && counts.saidas > 0 ? saidas / counts.saidas : 0;
  const totalTransacoes = (counts?.entradas || 0) + (counts?.saidas || 0);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mx-4 mb-4">
      {/* Header Colapsável */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-3"
      >
        <span className="text-sm font-semibold text-gray-200">
          💰 Resumo Financeiro - {period}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Saldo Principal */}
      <div className="flex flex-col items-center mb-3 pb-3 border-b border-gray-700">
        <span className="text-xs text-gray-400 mb-1">Saldo Atual</span>
        <span
          className={`text-3xl font-bold ${
            balance >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {formatCurrency(balance)}
        </span>
      </div>

      {/* Métricas Inline */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-base">↗</span>
            <span className="text-base font-bold text-green-400">
              {formatCurrency(entradas)}
            </span>
          </div>
          <span className="text-xs text-gray-400">Entradas</span>
        </div>

        <div className="w-px h-10 bg-gray-700" />

        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-base">↘</span>
            <span className="text-base font-bold text-red-400">
              {formatCurrency(saidas)}
            </span>
          </div>
          <span className="text-xs text-gray-400">Saídas</span>
        </div>

        <div className="w-px h-10 bg-gray-700" />

        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-base">⊙</span>
            <span className="text-base font-bold text-yellow-400">
              {formatCurrency(pendentes)}
            </span>
          </div>
          <span className="text-xs text-gray-400">Pendente</span>
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Total de transações:</span>
            <span className="text-sm font-semibold text-white">{totalTransacoes}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Ticket médio entradas:</span>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(ticketMedioEntradas)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Ticket médio saídas:</span>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(ticketMedioSaidas)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
