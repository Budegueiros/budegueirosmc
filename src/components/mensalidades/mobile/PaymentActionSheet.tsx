import { X, CheckCircle2, RotateCcw, Mail, FileText, MessageCircle, Trash2 } from 'lucide-react';

interface Mensalidade {
  id: string;
  membro_id: string;
  mes_referencia: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  membros: {
    nome_guerra: string;
  };
}

interface PaymentActionSheetProps {
  visible: boolean;
  onClose: () => void;
  payment: Mensalidade | null;
  onMarkAsPaid?: (id: string) => void;
  onMarkAsUnpaid?: (id: string) => void;
  onSendReminder?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function PaymentActionSheet({
  visible,
  onClose,
  payment,
  onMarkAsPaid,
  onMarkAsUnpaid,
  onSendReminder,
  onDelete,
}: PaymentActionSheetProps) {
  if (!visible || !payment) return null;

  const isPaid = payment.status.toLowerCase() === 'pago';

  const formatarMes = (mesRef: string) => {
    const date = new Date(mesRef + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-800 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white text-center mb-1">
            Ações para {payment.membros.nome_guerra}
          </h3>
          <p className="text-sm text-gray-400 text-center">
            Mensalidade de {formatarMes(payment.mes_referencia)}
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {!isPaid ? (
            <button
              onClick={() => onMarkAsPaid && handleAction(() => onMarkAsPaid(payment.id))}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-700/50 transition"
            >
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <span className="flex-1 text-left text-white font-medium">
                Marcar como Pago
              </span>
            </button>
          ) : (
            <button
              onClick={() => onMarkAsUnpaid && handleAction(() => onMarkAsUnpaid(payment.id))}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-700/50 transition"
            >
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <RotateCcw className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="flex-1 text-left text-white font-medium">
                Marcar como Não Pago
              </span>
            </button>
          )}

          {!isPaid && (
            <button
              onClick={() => onSendReminder && handleAction(() => onSendReminder(payment.id))}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-700/50 transition"
            >
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <span className="flex-1 text-left text-white font-medium">
                Enviar Lembrete
              </span>
            </button>
          )}

          <button
            onClick={() => {
              // Gerar comprovante/boleto
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-700/50 transition"
          >
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">
              {isPaid ? 'Ver Comprovante' : 'Gerar Boleto'}
            </span>
          </button>

          <button
            onClick={() => {
              // Enviar por WhatsApp
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-700/50 transition"
          >
            <div className="p-2 bg-green-500/20 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="flex-1 text-left text-white font-medium">
              Enviar por WhatsApp
            </span>
          </button>

          <button
            onClick={() => onDelete && handleAction(() => onDelete(payment.id))}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-500/20 transition border border-red-500/30"
          >
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <span className="flex-1 text-left text-red-400 font-medium">
              Excluir Mensalidade
            </span>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="px-4 pb-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition"
          >
            <span className="text-white font-semibold">Cancelar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

