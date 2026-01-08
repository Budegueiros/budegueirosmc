import { useState } from 'react';
import { ChevronUp, ChevronDown, Settings, Edit2, UserX, UserCheck, Shield, ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Membro } from '../../types/database.types';
import CargoBadge from './CargoBadge';

interface MembroWithCargos extends Membro {
  cargos_ativos?: Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
  }>;
}

interface MembersTableProps {
  membros: MembroWithCargos[];
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onEdit: (membro: MembroWithCargos) => void;
  onToggleActive: (membro: MembroWithCargos) => void;
  onToggleAdmin: (membro: MembroWithCargos) => void;
  currentUserId?: string;
}

type SortField = 'nome' | 'carteira' | 'cargo' | 'cidade' | null;
type SortDirection = 'asc' | 'desc';

export default function MembersTable({
  membros,
  selectedIds,
  setSelectedIds,
  onEdit,
  onToggleActive,
  onToggleAdmin,
  currentUserId,
}: MembersTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedMembros = [...membros].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;

    switch (sortField) {
      case 'nome':
        comparison = a.nome_guerra.localeCompare(b.nome_guerra);
        break;
      case 'carteira':
        const carteiraA = parseInt(a.numero_carteira) || 0;
        const carteiraB = parseInt(b.numero_carteira) || 0;
        comparison = carteiraA - carteiraB;
        break;
      case 'cargo':
        const cargoA = a.cargos_ativos?.[0]?.nome || '';
        const cargoB = b.cargos_ativos?.[0]?.nome || '';
        comparison = cargoA.localeCompare(cargoB);
        break;
      case 'cidade':
        const cidadeA = a.endereco_cidade || '';
        const cidadeB = b.endereco_cidade || '';
        comparison = cidadeA.localeCompare(cidadeB);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedMembros.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const isAllSelected = sortedMembros.length > 0 && selectedIds.length === sortedMembros.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedMembros.length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-500 opacity-0" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-white" />
      : <ChevronDown className="w-4 h-4 text-white" />;
  };

  const handleRowClick = (membroId: string) => {
    navigate(`/manage-members/${membroId}`);
  };

  const handleDelete = (membroId: string) => {
    const membro = membros.find(m => m.id === membroId);
    if (membro && window.confirm(`Deseja realmente ${membro.ativo ? 'desativar' : 'excluir'} este membro?`)) {
      onToggleActive(membro);
    }
  };

  if (sortedMembros.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg mb-2">Nenhum integrante encontrado</p>
        <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-800 border-b border-gray-700">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isIndeterminate;
                }}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
            </th>
            <th 
              className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('nome')}
            >
              <div className="flex items-center gap-2">
                Nome
                <SortIcon field="nome" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('carteira')}
            >
              <div className="flex items-center gap-2">
                Nº Membro
                <SortIcon field="carteira" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('cargo')}
            >
              <div className="flex items-center gap-2">
                Cargo
                <SortIcon field="cargo" />
              </div>
            </th>
            <th className="px-4 py-3 text-gray-300 font-medium">
              Contato
            </th>
            <th 
              className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('cidade')}
            >
              <div className="flex items-center gap-2">
                Localização
                <SortIcon field="cidade" />
              </div>
            </th>
            <th className="px-4 py-3 text-gray-300 font-medium text-right">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedMembros.map((membro) => {
            const isSelected = selectedIds.includes(membro.id);

            return (
              <tr
                key={membro.id}
                onClick={() => handleRowClick(membro.id)}
                className={`hover:bg-gray-800/30 transition cursor-pointer ${isSelected ? 'bg-gray-800/50' : ''} ${!membro.ativo ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(membro.id, e)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {membro.foto_url ? (
                      <img
                        src={membro.foto_url}
                        alt={membro.nome_guerra}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-gray-300">
                          {membro.nome_guerra.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-white truncate">{membro.nome_guerra}</p>
                        {membro.is_admin && (
                          <Shield className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        )}
                        {!membro.ativo && (
                          <span className="text-xs text-gray-500">Inativo</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{membro.nome_completo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300 font-medium">
                  {membro.numero_carteira}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {membro.cargos_ativos && membro.cargos_ativos.length > 0 ? (
                      membro.cargos_ativos.map((cargo) => (
                        <CargoBadge key={cargo.id} nome={cargo.nome} tipo={cargo.tipo_cargo} />
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">Sem cargo</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    {membro.email && (
                      <p className="text-xs text-gray-400 truncate max-w-[200px]" title={membro.email}>
                        {membro.email}
                      </p>
                    )}
                    {membro.telefone && (
                      <p className="text-xs text-gray-400">{membro.telefone}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300 text-sm">
                  {membro.endereco_cidade && membro.endereco_estado ? (
                    `${membro.endereco_cidade} - ${membro.endereco_estado}`
                  ) : membro.endereco_cidade || membro.endereco_estado || (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/manage-members/${membro.id}`);
                      }}
                      className="p-1.5 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
                      title="Ver detalhes"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(membro);
                      }}
                      className="p-1.5 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleAdmin(membro);
                      }}
                      disabled={membro.user_id === currentUserId && membro.is_admin}
                      className={`p-1.5 rounded transition ${
                        membro.is_admin
                          ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-500'
                          : 'hover:bg-gray-700 text-gray-400 hover:text-white'
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(membro.id);
                      }}
                      className="p-1.5 hover:bg-red-600 rounded transition text-gray-400 hover:text-white"
                      title={membro.ativo ? 'Desativar' : 'Ativar'}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
