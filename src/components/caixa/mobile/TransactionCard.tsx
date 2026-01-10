import { Eye, Edit2, Trash2, Paperclip } from 'lucide-react';
import { FluxoCaixaComMembro } from '../../../types/database.types';
import CategoriaBadge from '../CategoriaBadge';

interface TransactionCardProps {
  transaction: FluxoCaixaComMembro;
  onView?: (id: string) => void;
  onEdit?: (transaction: FluxoCaixaComMembro) => void;
  onDelete?: (id: string) => void;
  onViewAnexo?: (url: string, fileName?: string) => void;
}

export default function TransactionCard({
  transaction,
  onView,
  onEdit,
  onDelete,
  onViewAnexo,
}: TransactionCardProps) {
  const isIncome = transaction.tipo === 'entrada';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-3 mx-4 shadow-lg">
      {/* Header com Tipo e Descrição */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isIncome
              ? 'bg-green-500/15 border border-green-500/30'
              : 'bg-red-500/15 border border-red-500/30'
          }`}
        >
          <span className="text-xl">{isIncome ? '↗' : '↘'}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white mb-1 line-clamp-1">
            {transaction.descricao}
          </h3>
          {transaction.membros && (
            <p className="text-xs text-gray-400 truncate">
              Por: {transaction.membros.nome_guerra}
            </p>
          )}
        </div>
      </div>

      {/* Valor */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
        <span className="text-lg">💰</span>
        <span
          className={`text-2xl font-bold ${
            isIncome ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(Math.abs(transaction.valor))}
        </span>
      </div>

      {/* Detalhes */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-300 flex-wrap">
          <span className="text-base">🏷️</span>
          <CategoriaBadge categoria={transaction.categoria} />
          <span className="text-gray-600">-</span>
          <span className="text-gray-400">{formatDate(transaction.data)}</span>
          {transaction.created_at && (
            <>
              <span className="text-gray-600">-</span>
              <span className="text-gray-400">
                {formatTime(transaction.created_at)}
              </span>
            </>
          )}
          {transaction.anexo_url && (
            <>
              <span className="text-gray-600">-</span>
              <span className="text-base">📎</span>
            </>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-3 border-t border-gray-700">
        {onView && (
          <button
            onClick={() => onView(transaction.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition min-h-[44px]"
          >
            <Eye className="w-5 h-5 text-white" />
            <span className="text-xs font-semibold text-white">Ver</span>
          </button>
        )}

        {onEdit && (
          <button
            onClick={() => onEdit(transaction)}
            className="flex items-center justify-center w-12 py-2.5 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition min-h-[44px]"
            title="Editar"
          >
            <Edit2 className="w-5 h-5 text-white" />
          </button>
        )}

        {transaction.anexo_url && onViewAnexo && (
          <button
            onClick={() => onViewAnexo(transaction.anexo_url!, transaction.descricao)}
            className="flex items-center justify-center w-12 py-2.5 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition min-h-[44px]"
            title="Ver anexo"
          >
            <Paperclip className="w-5 h-5 text-white" />
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja excluir este lançamento?')) {
                onDelete(transaction.id);
              }
            }}
            className="flex items-center justify-center w-12 py-2.5 px-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition min-h-[44px]"
            title="Excluir"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
}
