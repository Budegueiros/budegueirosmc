// ============================================================================
// Componente MembersTable
// ============================================================================
// Descrição: Tabela responsiva para exibição de membros no Desktop
// Data: 2025-01-XX
// ============================================================================

import { Shield, ShieldOff, Mail, Phone, MapPin, Edit2, UserX, UserCheck } from 'lucide-react';
import { Membro, STATUS_STYLES } from '../../types/database.types';

interface MembroWithCargos extends Membro {
  cargos_ativos?: Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
  }>;
}

interface MembersTableProps {
  membros: MembroWithCargos[];
  onEdit: (membro: MembroWithCargos) => void;
  onToggleActive: (membro: MembroWithCargos) => void;
  onToggleAdmin: (membro: MembroWithCargos) => void;
  currentUserId?: string;
}

/**
 * Componente de tabela para exibição de membros no Desktop
 * 
 * @param membros - Lista de membros
 * @param onEdit - Callback quando o botão de editar é clicado
 * @param onToggleActive - Callback para alternar status ativo/inativo
 * @param onToggleAdmin - Callback para alternar privilégios de admin
 * @param currentUserId - ID do usuário atual (para prevenir auto-desativação)
 * 
 * @example
 * ```tsx
 * <MembersTable 
 *   membros={membros} 
 *   onEdit={handleEdit}
 *   onToggleActive={handleToggleActive}
 *   onToggleAdmin={handleToggleAdmin}
 *   currentUserId={user?.id}
 * />
 * ```
 */
export default function MembersTable({
  membros,
  onEdit,
  onToggleActive,
  onToggleAdmin,
  currentUserId,
}: MembersTableProps) {
  if (membros.length === 0) {
    return (
      <div className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg p-12 text-center">
        <p className="text-[#B0B0B0] font-oswald uppercase">Nenhum membro encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#121212] border-b border-[#D32F2F]/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Foto / Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Cargo
              </th>
              <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Contato
              </th>
              <th className="px-4 py-3 text-left text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Localização
              </th>
              <th className="px-4 py-3 text-center text-xs font-oswald uppercase text-[#B0B0B0] tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D32F2F]/10">
            {membros.map((membro) => (
              <tr
                key={membro.id}
                className={`hover:bg-[#121212]/50 transition ${
                  !membro.ativo ? 'opacity-60' : ''
                }`}
              >
                {/* Foto / Nome */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {membro.foto_url ? (
                      <img
                        src={membro.foto_url}
                        alt={membro.nome_guerra}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#D32F2F]/30"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#121212] border-2 border-[#D32F2F]/30 flex items-center justify-center">
                        <span className="text-sm font-oswald font-bold text-[#D32F2F]">
                          {membro.nome_guerra.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-oswald text-sm uppercase font-bold truncate">
                          {membro.nome_guerra}
                        </p>
                        {membro.is_admin && (
                          <Shield className="w-3 h-3 text-[#D32F2F] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[#B0B0B0] text-xs truncate">{membro.nome_completo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${
                            STATUS_STYLES[membro.status_membro].bg
                          } ${STATUS_STYLES[membro.status_membro].text}`}
                        >
                          {membro.status_membro}
                        </span>
                        {!membro.ativo && (
                          <span className="text-xs text-[#B0B0B0]">Inativo</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Cargo */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {membro.cargos_ativos && membro.cargos_ativos.length > 0 ? (
                      membro.cargos_ativos.map((cargo) => (
                        <span
                          key={cargo.id}
                          className="inline-flex px-2 py-1 rounded text-xs bg-[#121212] text-[#B0B0B0] border border-[#D32F2F]/20"
                          title={cargo.tipo_cargo}
                        >
                          {cargo.nome}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#B0B0B0]">Sem cargo</span>
                    )}
                  </div>
                </td>

                {/* Contato */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {membro.email && (
                      <div className="flex items-center gap-2 text-xs text-[#B0B0B0]">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{membro.email}</span>
                      </div>
                    )}
                    {membro.telefone && (
                      <div className="flex items-center gap-2 text-xs text-[#B0B0B0]">
                        <Phone className="w-3 h-3" />
                        <span>{membro.telefone}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Localização */}
                <td className="px-4 py-3">
                  {membro.endereco_cidade || membro.endereco_estado ? (
                    <div className="flex items-center gap-2 text-xs text-[#B0B0B0]">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {membro.endereco_cidade && membro.endereco_estado
                          ? `${membro.endereco_cidade} - ${membro.endereco_estado}`
                          : membro.endereco_cidade || membro.endereco_estado}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#B0B0B0]">-</span>
                  )}
                </td>

                {/* Ações */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(membro)}
                      className="p-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded transition"
                      title="Editar membro"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleAdmin(membro)}
                      disabled={membro.user_id === currentUserId && membro.is_admin}
                      className={`p-2 rounded transition ${
                        membro.is_admin
                          ? 'bg-[#D32F2F]/20 hover:bg-[#D32F2F]/30 text-[#D32F2F]'
                          : 'bg-[#121212] hover:bg-[#1E1E1E] text-[#B0B0B0]'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={membro.is_admin ? 'Remover admin' : 'Tornar admin'}
                    >
                      {membro.is_admin ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <ShieldOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onToggleActive(membro)}
                      className={`p-2 rounded transition ${
                        membro.ativo
                          ? 'bg-[#121212] hover:bg-[#1E1E1E] text-[#B0B0B0]'
                          : 'bg-green-600/20 hover:bg-green-600/30 text-green-500'
                      }`}
                      title={membro.ativo ? 'Desativar membro' : 'Ativar membro'}
                    >
                      {membro.ativo ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
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

