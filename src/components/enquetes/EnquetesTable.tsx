import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Enquete {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'multipla_escolha' | 'texto_livre';
  data_encerramento: string;
  status: 'aberta' | 'encerrada';
  created_at: string;
  total_votos: number;
}

interface EnquetesTableProps {
  enquetes: Enquete[];
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onRowClick?: (id: string) => void;
}

type SortField = 'titulo' | 'status' | 'votos' | null;
type SortDirection = 'asc' | 'desc';

export default function EnquetesTable({
  enquetes,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
  onToggleStatus,
  onRowClick
}: EnquetesTableProps) {
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

  const sortedEnquetes = [...enquetes].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;

    switch (sortField) {
      case 'titulo':
        comparison = a.titulo.localeCompare(b.titulo);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'votos':
        comparison = a.total_votos - b.total_votos;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedEnquetes.map(e => e.id));
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

  const isAllSelected = sortedEnquetes.length > 0 && selectedIds.length === sortedEnquetes.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedEnquetes.length;

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

  if (sortedEnquetes.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg mb-2">Nenhuma enquete encontrada</p>
        <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-800 border-b border-gray-700">
          <tr>
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
                Pergunta/Título
                <SortIcon field="titulo" />
              </div>
            </th>
            <th 
              className="px-4 py-2 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-2">
                Status
                <SortIcon field="status" />
              </div>
            </th>
            <th 
              className="px-4 py-2 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('votos')}
            >
              <div className="flex items-center gap-2">
                Total de Votos
                <SortIcon field="votos" />
              </div>
            </th>
            <th className="px-4 py-2 text-gray-300 font-medium">
              Tipo
            </th>
            <th className="px-4 py-2 text-gray-300 font-medium text-right">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedEnquetes.map((enquete) => {
            const isSelected = selectedIds.includes(enquete.id);

            return (
              <tr
                key={enquete.id}
                onClick={() => onRowClick?.(enquete.id)}
                className={`hover:bg-gray-800/30 transition cursor-pointer ${isSelected ? 'bg-gray-800/50' : ''}`}
              >
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(enquete.id, e)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <div>
                    <p className="font-medium text-white truncate max-w-[300px]">{enquete.titulo}</p>
                    {enquete.descricao && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[300px]">{enquete.descricao}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      Encerra em: {formatarData(enquete.data_encerramento)}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    enquete.status === 'aberta' 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      enquete.status === 'aberta' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    {enquete.status === 'aberta' ? 'Ativa' : 'Finalizada'}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-300 font-medium">
                  {enquete.total_votos}
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                    {enquete.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Texto Livre'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {onToggleStatus && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(enquete.id);
                        }}
                        title={enquete.status === 'aberta' ? 'Encerrar' : 'Reabrir'}
                        className={`p-1.5 rounded transition ${
                          enquete.status === 'aberta'
                            ? 'hover:bg-orange-600 text-orange-400 hover:text-white'
                            : 'hover:bg-green-600 text-green-400 hover:text-white'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {enquete.status === 'aberta' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(enquete.id);
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
                        if (window.confirm('Deseja realmente excluir esta enquete?')) {
                          onDelete(enquete.id);
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

