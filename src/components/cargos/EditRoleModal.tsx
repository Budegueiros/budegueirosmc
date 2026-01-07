// ============================================================================
// Componente EditRoleModal
// ============================================================================
// Descrição: Modal para criar/editar cargos
// Data: 2025-01-XX
// ============================================================================

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { TipoCargoEnum } from '../../types/database.types';
import { useToast } from '../../contexts/ToastContext';
import { CargoComEstatisticas } from '../../hooks/useCargos';

interface EditRoleModalProps {
  cargo: CargoComEstatisticas | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    nome: string;
    nivel: number;
    tipo_cargo: TipoCargoEnum;
    descricao: string | null;
    ativo: boolean;
  }) => Promise<void>;
  isCreating?: boolean;
}

export default function EditRoleModal({
  cargo,
  isOpen,
  onClose,
  onSave,
  isCreating = false,
}: EditRoleModalProps) {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoCargo, setTipoCargo] = useState<TipoCargoEnum>('Operacional');
  const [nivel, setNivel] = useState(1);
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar dados do cargo quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      if (cargo && !isCreating) {
        setNome(cargo.nome);
        setDescricao(cargo.descricao || '');
        setTipoCargo(cargo.tipo_cargo);
        setNivel(cargo.nivel);
        setAtivo(cargo.ativo);
      } else {
        // Reset para criação
        setNome('');
        setDescricao('');
        setTipoCargo('Operacional');
        setNivel(1);
        setAtivo(true);
      }
    }
  }, [cargo, isOpen, isCreating]);

  const validateForm = (): boolean => {
    if (!nome.trim()) {
      toastWarning('O nome do cargo é obrigatório.');
      return false;
    }

    if (nivel < 1) {
      toastWarning('O nível deve ser maior que zero.');
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
        nivel,
        tipo_cargo: tipoCargo,
        descricao: descricao.trim() || null,
        ativo,
      });
      toastSuccess(isCreating ? 'Cargo criado com sucesso!' : 'Cargo atualizado com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar cargo:', error);
      toastError(error.message || 'Erro ao salvar cargo. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

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
                {isCreating ? 'Criar Novo Cargo' : 'Editar Cargo'}
              </h2>
              {!isCreating && cargo && (
                <p className="text-[#B0B0B0] text-sm mt-1">{cargo.nome}</p>
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
                  Nome do Cargo <span className="text-[#D32F2F]">*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                  placeholder="Ex: Presidente, Tesoureiro, etc."
                  disabled={saving}
                />
              </div>

              {/* Tipo e Nível */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                    Tipo de Cargo <span className="text-[#D32F2F]">*</span>
                  </label>
                  <select
                    value={tipoCargo}
                    onChange={(e) => setTipoCargo(e.target.value as TipoCargoEnum)}
                    className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                    disabled={saving}
                  >
                    <option value="Administrativo">Administrativo</option>
                    <option value="Operacional">Operacional</option>
                    <option value="Honorario">Honorário</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                    Nível de Hierarquia <span className="text-[#D32F2F]">*</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={nivel}
                      onChange={(e) => setNivel(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition"
                      disabled={saving}
                    />
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={nivel}
                      onChange={(e) => setNivel(parseInt(e.target.value))}
                      className="w-full h-2 bg-[#121212] rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
                      disabled={saving}
                    />
                    <p className="text-[#B0B0B0] text-xs">
                      Nível hierárquico (1 = mais alto, 100 = mais baixo)
                    </p>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D32F2F] transition resize-none"
                  placeholder="Descrição das responsabilidades do cargo..."
                  disabled={saving}
                />
              </div>

              {/* Status Ativo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-5 h-5 rounded border-[#D32F2F]/30 bg-[#121212] text-[#D32F2F] focus:ring-[#D32F2F] focus:ring-offset-0"
                  disabled={saving}
                />
                <label htmlFor="ativo" className="text-[#B0B0B0] text-sm cursor-pointer">
                  Cargo ativo
                </label>
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

