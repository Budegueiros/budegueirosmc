// ============================================================================
// Componente CargoAccordion
// ============================================================================
// Descrição: Accordion colapsável para exibição de cargos no Mobile
// Data: 2025-01-XX
// ============================================================================

import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Shield, ShieldOff, Users } from 'lucide-react';
import { TIPO_CARGO_STYLES } from '../../types/database.types';
import { CargoComEstatisticas } from '../../hooks/useCargos';

interface CargoAccordionProps {
  cargos: CargoComEstatisticas[];
  onEdit: (cargo: CargoComEstatisticas) => void;
  onToggleStatus: (cargo: CargoComEstatisticas) => void;
}

interface CargoItemProps {
  cargo: CargoComEstatisticas;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

function CargoItem({
  cargo,
  isOpen,
  onToggle,
  onEdit,
  onToggleStatus,
}: CargoItemProps) {
  return (
    <div className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg overflow-hidden mb-3">
      {/* Header - Sempre visível */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-[#121212]/50 transition"
      >
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-white font-oswald text-base uppercase font-bold truncate">
              {cargo.nome}
            </h3>
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase flex-shrink-0 ${
                TIPO_CARGO_STYLES[cargo.tipo_cargo]?.bg || 'bg-gray-800'
              } ${
                TIPO_CARGO_STYLES[cargo.tipo_cargo]?.text || 'text-gray-400'
              }`}
            >
              {cargo.tipo_cargo}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#B0B0B0]">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>
                {cargo.membros_count} {cargo.membros_count === 1 ? 'integrante' : 'integrantes'}
              </span>
            </div>
            <span className="text-[#B0B0B0]">•</span>
            <span>Nível {cargo.nivel}</span>
            {!cargo.ativo && (
              <>
                <span className="text-[#B0B0B0]">•</span>
                <span className="text-red-400">Inativo</span>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-[#B0B0B0]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#B0B0B0]" />
          )}
        </div>
      </button>

      {/* Conteúdo - Expandido quando isOpen */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-[#D32F2F]/10 animate-fade-in">
          <div className="pt-4 space-y-4">
            {/* Descrição */}
            {cargo.descricao && (
              <div>
                <p className="text-[#B0B0B0] text-xs uppercase mb-1">Descrição</p>
                <p className="text-white text-sm">{cargo.descricao}</p>
              </div>
            )}

            {/* Status */}
            <div>
              <p className="text-[#B0B0B0] text-xs uppercase mb-2">Status</p>
              {cargo.ativo ? (
                <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-green-950/40 text-green-400 border border-green-800/30">
                  Ativo
                </span>
              ) : (
                <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-red-950/40 text-red-400 border border-red-800/30">
                  Inativo
                </span>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-oswald uppercase font-bold px-4 py-2 rounded-lg transition text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={onToggleStatus}
                className={`flex-1 flex items-center justify-center gap-2 font-oswald uppercase font-bold px-4 py-2 rounded-lg transition text-sm ${
                  cargo.ativo
                    ? 'bg-[#121212] hover:bg-[#1E1E1E] text-[#B0B0B0] border border-[#D32F2F]/30'
                    : 'bg-green-600/20 hover:bg-green-600/30 text-green-500'
                }`}
              >
                {cargo.ativo ? (
                  <>
                    <Shield className="w-4 h-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-4 h-4" />
                    Ativar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente accordion para exibição de cargos no Mobile
 * 
 * @param cargos - Lista de cargos com estatísticas
 * @param onEdit - Callback quando o botão de editar é clicado
 * @param onToggleStatus - Callback para alternar status ativo/inativo
 * 
 * @example
 * ```tsx
 * <CargoAccordion 
 *   cargos={cargos} 
 *   onEdit={handleEdit}
 *   onToggleStatus={handleToggleStatus}
 * />
 * ```
 */
export default function CargoAccordion({
  cargos,
  onEdit,
  onToggleStatus,
}: CargoAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (cargoId: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cargoId)) {
        newSet.delete(cargoId);
      } else {
        newSet.add(cargoId);
      }
      return newSet;
    });
  };

  if (cargos.length === 0) {
    return (
      <div className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg p-12 text-center">
        <Shield className="w-16 h-16 text-[#B0B0B0]/30 mx-auto mb-4" />
        <p className="text-[#B0B0B0] font-oswald uppercase">Nenhum cargo cadastrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {cargos.map((cargo) => (
        <CargoItem
          key={cargo.id}
          cargo={cargo}
          isOpen={openItems.has(cargo.id)}
          onToggle={() => toggleItem(cargo.id)}
          onEdit={() => onEdit(cargo)}
          onToggleStatus={() => onToggleStatus(cargo)}
        />
      ))}
    </div>
  );
}

