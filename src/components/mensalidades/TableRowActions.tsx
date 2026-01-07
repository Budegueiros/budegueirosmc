import { DollarSign, MessageSquare, Edit2, Clock, Trash2 } from 'lucide-react';

interface TableRowActionsProps {
  mensalidadeId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onGerarCobranca?: (id: string) => void;
  onEnviarLembrete?: (id: string) => void;
  onVerHistorico?: (id: string) => void;
}

export default function TableRowActions({
  mensalidadeId,
  onEdit,
  onDelete,
  onGerarCobranca,
  onEnviarLembrete,
  onVerHistorico
}: TableRowActionsProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Deseja realmente excluir esta mensalidade?')) {
      onDelete(mensalidadeId);
    }
  };

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {onGerarCobranca && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGerarCobranca(mensalidadeId);
          }}
          title="Gerar cobrança"
          className="p-2 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
        >
          <DollarSign className="w-4 h-4" />
        </button>
      )}

      {onEnviarLembrete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEnviarLembrete(mensalidadeId);
          }}
          title="Enviar lembrete"
          className="p-2 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(mensalidadeId);
        }}
        title="Editar"
        className="p-2 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {onVerHistorico && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVerHistorico(mensalidadeId);
          }}
          title="Ver histórico"
          className="p-2 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
        >
          <Clock className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={handleDelete}
        title="Excluir"
        className="p-2 hover:bg-red-600 rounded transition text-gray-400 hover:text-white"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

