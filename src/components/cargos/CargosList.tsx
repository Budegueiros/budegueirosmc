// ============================================================================
// Componente CargosList
// ============================================================================
// Descrição: Lista administrativa de cargos para Desktop
// Data: 2025-01-XX
// ============================================================================

import { GripVertical, Edit2, Shield, ShieldOff, Users } from 'lucide-react';
import { TIPO_CARGO_STYLES } from '../../types/database.types';
import { CargoComEstatisticas } from '../../hooks/useCargos';

interface CargosListProps {
  cargos: CargoComEstatisticas[];
  onEdit: (cargo: CargoComEstatisticas) => void;
  onToggleStatus: (cargo: CargoComEstatisticas) => void;
}

/**
 * Componente de lista para exibição de cargos no Desktop
 * 
 * @param cargos - Lista de cargos com estatísticas
 * @param onEdit - Callback quando o botão de editar é clicado
 * @param onToggleStatus - Callback para alternar status ativo/inativo
 * 
 * @example
 * ```tsx
 * <CargosList 
 *   cargos={cargos} 
 *   onEdit={handleEdit}
 *   onToggleStatus={handleToggleStatus}
 * />
 * ```
 */
export default function CargosList({
  cargos,
  onEdit,
  onToggleStatus,
}: CargosListProps) {
  if (cargos.length === 0) {
    return (
      <div className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg p-12 text-center">
        <Shield className="w-16 h-16 text-[#B0B0B0]/30 mx-auto mb-4" />
        <p className="text-[#B0B0B0] font-oswald uppercase">Nenhum cargo cadastrado</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#121212] border-b border-[#D32F2F]/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider w-12">
                {/* Drag handle column */}
              </th>
              <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Cargo
              </th>
              <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Nível
              </th>
              <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Integrantes
              </th>
              <th className="px-4 py-3 text-center text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D32F2F]/10">
            {cargos.map((cargo) => (
              <tr
                key={cargo.id}
                className={`hover:bg-[#121212]/50 transition ${
                  !cargo.ativo ? 'opacity-60' : ''
                }`}
              >
                {/* Drag Handle */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <GripVertical className="w-5 h-5 text-[#B0B0B0]/40 cursor-move" />
                  </div>
                </td>

                {/* Nome do Cargo */}
                <td className="px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-white font-oswald text-sm uppercase font-bold truncate">
                      {cargo.nome}
                    </p>
                    {cargo.descricao && (
                      <p className="text-[#B0B0B0] text-xs truncate max-w-md mt-1">
                        {cargo.descricao}
                      </p>
                    )}
                  </div>
                </td>

                {/* Categoria */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-3 py-1 rounded text-xs font-bold uppercase ${
                      TIPO_CARGO_STYLES[cargo.tipo_cargo]?.bg || 'bg-gray-800'
                    } ${
                      TIPO_CARGO_STYLES[cargo.tipo_cargo]?.text || 'text-gray-400'
                    }`}
                  >
                    {cargo.tipo_cargo}
                  </span>
                </td>

                {/* Nível */}
                <td className="px-4 py-3">
                  <span className="inline-flex px-3 py-1 rounded text-xs font-bold bg-[#121212] text-[#B0B0B0] border border-[#D32F2F]/20">
                    Nível {cargo.nivel}
                  </span>
                </td>

                {/* Integrantes */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-[#B0B0B0] text-sm">
                    <Users className="w-4 h-4" />
                    <span>
                      {cargo.membros_count} {cargo.membros_count === 1 ? 'integrante' : 'integrantes'}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
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
                </td>

                {/* Ações */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(cargo)}
                      className="p-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded transition"
                      title="Editar cargo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(cargo)}
                      className={`p-2 rounded transition ${
                        cargo.ativo
                          ? 'bg-[#121212] hover:bg-[#1E1E1E] text-[#B0B0B0]'
                          : 'bg-green-600/20 hover:bg-green-600/30 text-green-500'
                      }`}
                      title={cargo.ativo ? 'Desativar cargo' : 'Ativar cargo'}
                    >
                      {cargo.ativo ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <ShieldOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

