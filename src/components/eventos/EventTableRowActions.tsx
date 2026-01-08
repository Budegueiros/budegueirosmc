import { Edit2, Trash2 } from 'lucide-react';

interface EventTableRowActionsProps {
  eventoId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string, nome: string) => void;
  eventoNome: string;
}

export default function EventTableRowActions({
  eventoId,
  onEdit,
  onDelete,
  eventoNome
}: EventTableRowActionsProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(eventoId, eventoNome);
  };

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(eventoId);
        }}
        title="Editar"
        className="p-2 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
      >
        <Edit2 className="w-4 h-4" />
      </button>

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

