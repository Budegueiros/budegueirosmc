// ============================================================================
// Componente EditCategoriaModal
// ============================================================================
// Descrição: Modal para criar/editar categorias do fluxo de caixa
// Data: 2025-01-XX
// ============================================================================

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { TipoFluxoCaixa } from '../../types/database.types';
import { useToast } from '../../contexts/ToastContext';
import { CategoriaComEstatisticas } from '../../hooks/useCategoriasCaixa';

interface EditCategoriaModalProps {
  categoria: CategoriaComEstatisticas | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    nome: string;
    tipo: TipoFluxoCaixa;
    cor?: string | null;
    descricao?: string | null;
    ativo?: boolean;
    ordem?: number;
  }) => Promise<void>;
  isCreating?: boolean;
}

export default function EditCategoriaModal({
  categoria,
  isOpen,
  onClose,
  onSave,
  isCreating = false,
}: EditCategoriaModalProps) {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoFluxoCaixa>('entrada');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [ordem, setOrdem] = useState(0);

  // Carregar dados da categoria quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      if (categoria && !isCreating) {
        setNome(categoria.nome);
        setTipo(categoria.tipo);
        setDescricao(categoria.descricao || '');
        setAtivo(categoria.ativo);
        setOrdem(categoria.ordem);
      } else {
        // Reset para criação
        setNome('');
        setTipo('entrada');
        setDescricao('');
        setAtivo(true);
        setOrdem(0);
      }
    }
  }, [categoria, isOpen, isCreating]);

  const validateForm = (): boolean => {
    if (!nome.trim()) {
      toastWarning('O nome da categoria é obrigatório.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await onSave({
        nome: nome.trim(),
        tipo,
        descricao: descricao.trim() || null,
        ativo,
        ordem,
      });
      toastSuccess(isCreating ? 'Categoria criada com sucesso!' : 'Categoria atualizada com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toastError(error.message || 'Erro ao salvar categoria. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop com blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Fixo */}
          <div className="sticky top-0 bg-[#1E1E1E] border-b border-[#D32F2F]/30 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-white font-oswald text-xl uppercase font-bold">
                {isCreating ? 'Criar Nova Categoria' : 'Editar Categoria'}
              </h2>
              {!isCreating && categoria && (
                <p className="text-[#B0B0B0] text-sm mt-1">{categoria.nome}</p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="text-[#B0B0B0] hover:text-white transition disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                  Nome da Categoria <span className="text-[#D32F2F]">*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                  placeholder="Ex: Mensalidade, Combustível, etc."
                  disabled={saving}
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                  Tipo <span className="text-[#D32F2F]">*</span>
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoFluxoCaixa)}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                  disabled={saving || !isCreating}
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
                {!isCreating && (
                  <p className="text-[#B0B0B0] text-xs mt-1">
                    O tipo não pode ser alterado após a criação
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition resize-none"
                  placeholder="Descrição da categoria..."
                  disabled={saving}
                />
              </div>

              {/* Ordem e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ordem}
                    onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                    disabled={saving}
                  />
                  <p className="text-[#B0B0B0] text-xs mt-1">
                    Menor número = aparece primeiro
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-8">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-5 h-5 rounded border-[#D32F2F]/30 bg-[#121212] text-[#D32F2F] focus:ring-[#D32F2F] focus:ring-offset-0"
                    disabled={saving}
                  />
                  <label htmlFor="ativo" className="text-[#B0B0B0] text-sm cursor-pointer">
                    Categoria ativa
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer com Botões */}
          <div className="sticky bottom-0 bg-[#1E1E1E] border-t border-[#D32F2F]/30 px-6 py-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-oswald uppercase font-bold px-6 py-3 rounded-lg transition disabled:opacity-50 flex-1 sm:flex-initial"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-[#121212] hover:bg-[#1E1E1E] text-white font-oswald uppercase font-bold px-6 py-3 rounded-lg transition border border-[#D32F2F]/30 disabled:opacity-50 flex-1 sm:flex-initial"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

