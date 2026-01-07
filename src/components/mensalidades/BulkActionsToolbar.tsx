import { X } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onGerarCobrancas?: () => void;
  onEnviarLembretes?: () => void;
}

export default function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onGerarCobrancas,
  onEnviarLembretes
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-600 text-white px-6 py-3 rounded-lg mb-4 flex items-center justify-between">
      <span className="font-medium">
        {selectedCount} {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
      </span>
      <div className="flex gap-2">
        {onGerarCobrancas && (
          <button
            onClick={onGerarCobrancas}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition text-sm font-medium"
          >
            Gerar Cobranças
          </button>
        )}
        {onEnviarLembretes && (
          <button
            onClick={onEnviarLembretes}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition text-sm font-medium"
          >
            Enviar Lembretes
          </button>
        )}
        <button
          onClick={onClearSelection}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition text-sm font-medium flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </div>
  );
}

