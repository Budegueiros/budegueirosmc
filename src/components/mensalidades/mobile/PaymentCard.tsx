import { Eye, Edit, MoreVertical, Check } from 'lucide-react';
import { formatarValor, formatarData, calcularDiasAtraso } from '../../../utils/mensalidadesHelpers';

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
  membros: {
    nome_completo: string;
    nome_guerra: string;
    numero_carteira: string;
    cidade?: string;
  };
}

interface PaymentCardProps {
  payment: Mensalidade;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onMoreActions: (id: string) => void;
}

export default function PaymentCard({
  payment,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onMoreActions,
}: PaymentCardProps) {
  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pago':
        return {
          color: '#4CAF50',
          bgColor: 'bg-green-500/15',
          borderColor: 'border-green-500/30',
          icon: '✓',
          label: 'PAGO',
        };
      case 'aberto':
        return {
          color: '#FFA726',
          bgColor: 'bg-yellow-500/15',
          borderColor: 'border-yellow-500/30',
          icon: '○',
          label: 'ABERTO',
        };
      case 'atrasado':
        return {
          color: '#EF5350',
          bgColor: 'bg-red-500/15',
          borderColor: 'border-red-500/30',
          icon: '⚠',
          label: 'ATRASADO',
        };
      case 'pendente':
        return {
          color: '#FFA726',
          bgColor: 'bg-yellow-500/15',
          borderColor: 'border-yellow-500/30',
          icon: '○',
          label: 'PENDENTE',
        };
      default:
        return {
          color: '#757575',
          bgColor: 'bg-gray-500/15',
          borderColor: 'border-gray-500/30',
          icon: '?',
          label: status.toUpperCase(),
        };
    }
  };

  const statusConfig = getStatusConfig(payment.status);
  const diasAtraso = calcularDiasAtraso(payment);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-3 shadow-lg">
      {/* Header com Checkbox e Status */}
      <div className="flex items-start gap-3 mb-3">
        <button
          onClick={onToggleSelect}
          className="mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 border-gray-600 bg-transparent flex items-center justify-center transition-all hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          style={{
            backgroundColor: isSelected ? '#2196F3' : 'transparent',
            borderColor: isSelected ? '#2196F3' : 'rgba(75, 85, 99, 1)',
          }}
        >
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-2 truncate">
            {payment.membros.nome_guerra}
          </h3>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
            <span className="text-xs">{statusConfig.icon}</span>
            <span
              className="text-xs font-bold"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Detalhes do Membro */}
      <div className="space-y-3 mb-4 pt-3 border-t border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="font-medium">#{payment.membros.numero_carteira}</span>
          <span className="text-gray-600">-</span>
          <span className="truncate" title={payment.membros.nome_completo}>
            {payment.membros.nome_completo}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <span className="text-base font-bold text-green-400">
              {formatarValor(payment.valor)}
            </span>
          </div>

          <div className="flex-1 h-px bg-gray-700" />

          <div className="flex flex-col">
            {payment.status.toLowerCase() === 'pago' && payment.data_pagamento ? (
              <>
                <span className="text-xs text-gray-500">Pago em:</span>
                <span className="text-sm font-semibold text-gray-300">
                  {formatarData(payment.data_pagamento)}
                </span>
              </>
            ) : (
              <>
                <span className="text-xs text-gray-500">
                  {payment.status.toLowerCase() === 'atrasado' ? 'Venceu em:' : 'Vence em:'}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    payment.status.toLowerCase() === 'atrasado'
                      ? 'text-red-400'
                      : 'text-gray-300'
                  }`}
                >
                  {formatarData(payment.data_vencimento)}
                </span>
              </>
            )}
          </div>
        </div>

        {diasAtraso > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg border-l-2 border-red-500">
            <span className="text-sm">⚠️</span>
            <span className="text-sm font-semibold text-red-400">
              {diasAtraso} {diasAtraso === 1 ? 'dia' : 'dias'} de atraso
            </span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-3 border-t border-gray-700">
        <button
          onClick={() => onView(payment.id)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition min-h-[60px]"
        >
          <Eye className="w-5 h-5 text-white" />
          <span className="text-xs font-semibold text-white">Ver</span>
        </button>

        <button
          onClick={() => onEdit(payment.id)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition min-h-[60px]"
        >
          <Edit className="w-5 h-5 text-white" />
          <span className="text-xs font-semibold text-white">Editar</span>
        </button>

        <button
          onClick={() => onMoreActions(payment.id)}
          className="flex items-center justify-center w-12 py-2.5 px-3 bg-transparent hover:bg-gray-700 rounded-lg transition min-h-[60px]"
        >
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

