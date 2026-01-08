import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ComunicadoComAutor } from '../../types/database.types';

interface ComunicadoComEstatisticas extends ComunicadoComAutor {
  total_destinatarios: number;
  total_lidos: number;
  percentual_leitura: number;
}

interface ComunicadosTableProps {
  comunicados: ComunicadoComEstatisticas[];
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRowClick?: (id: string) => void;
}

type SortField = 'titulo' | 'data' | 'percentual' | null;
type SortDirection = 'asc' | 'desc';

export default function ComunicadosTable({
  comunicados,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
  onRowClick
}: ComunicadosTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedComunicados = [...comunicados].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;

    switch (sortField) {
      case 'titulo':
        comparison = a.titulo.localeCompare(b.titulo);
        break;
      case 'data':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'percentual':
        comparison = a.percentual_leitura - b.percentual_leitura;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedComunicados.map(c => c.id));
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

  const isAllSelected = sortedComunicados.length > 0 && selectedIds.length === sortedComunicados.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedComunicados.length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-500 opacity-0" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-white" />
      : <ChevronDown className="w-4 h-4 text-white" />;
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPrioridadeColor = (prioridade: string) => {
    if (prioridade === 'critica') return 'text-red-500';
    if (prioridade === 'alta') return 'text-orange-500';
    return 'text-blue-500';
  };

  if (sortedComunicados.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg mb-2">Nenhum comunicado encontrado</p>
        <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-800 border-b border-gray-700">
          <tr>
            <th className="px-4 py-2 text-gray-300 font-medium w-12 text-center">#</th>
            <th className="w-10 px-4 py-2">
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
              className="px-4 py-2 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('titulo')}
            >
              <div className="flex items-center gap-2">
                Título
                <SortIcon field="titulo" />
              </div>
            </th>
            <th 
              className="px-4 py-2 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('data')}
            >
              <div className="flex items-center gap-2">
                Data de Envio
                <SortIcon field="data" />
              </div>
            </th>
            <th 
              className="px-4 py-2 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('percentual')}
            >
              <div className="flex items-center gap-2">
                % de Leitura
                <SortIcon field="percentual" />
              </div>
            </th>
            <th className="px-4 py-2 text-gray-300 font-medium text-right">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedComunicados.map((comunicado, index) => {
            const isSelected = selectedIds.includes(comunicado.id);

            return (
              <tr
                key={comunicado.id}
                onClick={() => onRowClick?.(comunicado.id)}
                className={`hover:bg-gray-800/30 transition cursor-pointer ${isSelected ? 'bg-gray-800/50' : ''}`}
              >
                <td className="px-4 py-2 text-gray-400 text-center text-sm">
                  {index + 1}
                </td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(comunicado.id, e)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getPrioridadeColor(comunicado.prioridade)}`} />
                    <p className="font-medium text-white truncate max-w-[300px]">{comunicado.titulo}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {comunicado.tipo_destinatario === 'geral' ? 'Geral' : 
                     comunicado.tipo_destinatario === 'cargo' ? `Cargo: ${comunicado.valor_destinatario}` : 
                     'Privado'}
                  </p>
                </td>
                <td className="px-4 py-2 text-gray-300">
                  {formatarData(comunicado.created_at)}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-[100px]">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            comunicado.percentual_leitura === 100
                              ? 'bg-green-500'
                              : comunicado.percentual_leitura >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${comunicado.percentual_leitura}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-medium min-w-[45px] text-right ${
                      comunicado.percentual_leitura === 100
                        ? 'text-green-500'
                        : comunicado.percentual_leitura >= 50
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}>
                      {comunicado.percentual_leitura}%
                    </span>
                    <span className="text-xs text-gray-400">
                      ({comunicado.total_lidos}/{comunicado.total_destinatarios})
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(comunicado.id);
                      }}
                      title="Editar"
                      className="p-1.5 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Deseja realmente excluir este comunicado?')) {
                          onDelete(comunicado.id);
                        }
                      }}
                      title="Excluir"
                      className="p-1.5 hover:bg-red-600 rounded transition text-gray-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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

