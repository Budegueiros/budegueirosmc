// ============================================================================
// Componente MemberCardCompact
// ============================================================================
// Descrição: Card compacto para exibição de membros no Mobile
// Data: 2025-01-XX
// ============================================================================

import { Shield, Mail, Phone, MapPin, Edit2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Membro, STATUS_STYLES } from '../../types/database.types';

interface MembroWithCargos extends Membro {
  cargos_ativos?: Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
  }>;
}

interface MemberCardCompactProps {
  membro: MembroWithCargos;
  onEdit: (membro: MembroWithCargos) => void;
}

/**
 * Componente de card compacto para exibição de membros no Mobile
 * Altura máxima: 120px
 * 
 * @param membro - Dados do membro
 * @param onEdit - Callback quando o botão de editar é clicado
 * 
 * @example
 * ```tsx
 * <MemberCardCompact 
 *   membro={membro} 
 *   onEdit={handleEdit} 
 * />
 * ```
 */
export default function MemberCardCompact({ membro, onEdit }: MemberCardCompactProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`bg-[#1E1E1E] border ${
        membro.ativo ? 'border-[#D32F2F]/30' : 'border-gray-700'
      } rounded-lg p-3 max-h-[120px] ${!membro.ativo ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3 h-full">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {membro.foto_url ? (
            <img
              src={membro.foto_url}
              alt={membro.nome_guerra}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#D32F2F]/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#121212] border-2 border-[#D32F2F]/30 flex items-center justify-center">
              <span className="text-lg font-oswald font-bold text-[#D32F2F]">
                {membro.nome_guerra.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-oswald text-sm uppercase font-bold truncate">
              {membro.nome_guerra}
            </h3>
            {membro.is_admin && (
              <Shield className="w-3 h-3 text-[#D32F2F] flex-shrink-0" />
            )}
          </div>

          {/* Status e Cargos */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${
                STATUS_STYLES[membro.status_membro].bg
              } ${STATUS_STYLES[membro.status_membro].text}`}
            >
              {membro.status_membro}
            </span>
            {membro.cargos_ativos && membro.cargos_ativos.length > 0 && (
              <span className="text-xs text-[#B0B0B0]">
                • {membro.cargos_ativos.length} cargo{membro.cargos_ativos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Contato Compacto */}
          <div className="flex items-center gap-2 text-xs text-[#B0B0B0] truncate">
            {membro.email && (
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span className="truncate">{membro.email}</span>
              </div>
            )}
            {membro.telefone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{membro.telefone}</span>
              </div>
            )}
            {membro.endereco_cidade && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{membro.endereco_cidade}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex-shrink-0 flex gap-1">
          <button
            onClick={() => navigate(`/manage-members/${membro.id}`)}
            className="bg-[#121212] hover:bg-[#1E1E1E] text-[#B0B0B0] hover:text-[#D32F2F] p-2 rounded transition"
            title="Ver detalhes do membro"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(membro)}
            className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white p-2 rounded transition"
            title="Editar membro"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

