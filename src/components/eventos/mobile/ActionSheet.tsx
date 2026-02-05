import { Edit2, Trash2, Users, FileText, X } from 'lucide-react';

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onManageParticipacoes?: () => void;
  onRelatorio?: () => void;
}

export default function ActionSheet({
  visible,
  onClose,
  onEdit,
  onDelete,
  onManageParticipacoes,
  onRelatorio
}: ActionSheetProps) {
  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 animate-fadeIn"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 rounded-t-2xl z-50 animate-slideUp pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Ações</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-gray-700 rounded-lg transition min-h-[44px] min-w-[44px]"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="py-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit();
              }}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-700 active:bg-gray-600 transition min-h-[44px]"
            >
              <div className="p-2 bg-gray-700 rounded-lg">
                <Edit2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-base text-white font-medium">Editar Evento</span>
            </button>
          )}

          {onManageParticipacoes && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onManageParticipacoes();
              }}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-700 active:bg-gray-600 transition min-h-[44px]"
            >
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-base text-white font-medium">Gerenciar Participações</span>
            </button>
          )}

          {onRelatorio && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRelatorio();
              }}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-700 active:bg-gray-600 transition min-h-[44px]"
            >
              <div className="p-2 bg-blue-600 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-base text-white font-medium">Ver Relatório</span>
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete();
              }}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-600/20 active:bg-red-600/30 transition border-t border-gray-700 mt-2 min-h-[44px]"
            >
              <div className="p-2 bg-red-600 rounded-lg">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-base text-red-400 font-medium">Excluir Evento</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
