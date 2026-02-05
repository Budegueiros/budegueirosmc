import { Trash2, Mail, Phone, UserCog, ArrowUp } from 'lucide-react';

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  onPromote?: (memberId: string) => void;
  onChangeStatus?: (memberId: string) => void;
  onSendEmail?: (memberId: string) => void;
  onSendWhatsApp?: (memberId: string) => void;
  onRemove?: (memberId: string) => void;
}

export default function ActionSheet({
  visible,
  onClose,
  memberId,
  memberName,
  onPromote,
  onChangeStatus,
  onSendEmail,
  onSendWhatsApp,
  onRemove,
}: ActionSheetProps) {
  if (!visible) return null;

  const actions = [
    {
      icon: ArrowUp,
      label: 'Promover/Alterar Cargo',
      onClick: () => {
        onPromote?.(memberId);
        onClose();
      },
    },
    {
      icon: UserCog,
      label: 'Alterar Status',
      onClick: () => {
        onChangeStatus?.(memberId);
        onClose();
      },
    },
    {
      icon: Mail,
      label: 'Enviar Email',
      onClick: () => {
        onSendEmail?.(memberId);
        onClose();
      },
    },
    {
      icon: Phone,
      label: 'Enviar WhatsApp',
      onClick: () => {
        onSendWhatsApp?.(memberId);
        onClose();
      },
    },
    {
      icon: Trash2,
      label: 'Remover Membro',
      onClick: () => {
        if (window.confirm(`Deseja realmente remover ${memberName}?`)) {
          onRemove?.(memberId);
        }
        onClose();
      },
      danger: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full bg-gray-800 border-t border-gray-700 rounded-t-2xl pb-8 animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 border-b border-gray-700">
          <h3 className="text-center text-lg font-semibold text-white">
            Ações para {memberName}
          </h3>
        </div>

        {/* Actions */}
        <div className="px-2 py-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`w-full flex items-center gap-4 p-4 rounded-lg mb-2 transition ${
                  action.danger
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                    : 'bg-gray-700/50 hover:bg-gray-700 text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cancel */}
        <div className="px-5 pt-2">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

