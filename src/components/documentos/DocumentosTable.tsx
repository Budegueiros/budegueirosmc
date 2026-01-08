import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { DocumentoComAutor } from '../../types/database.types';

interface DocumentoComEstatisticas extends DocumentoComAutor {
  total_destinatarios: number;
  total_acessos: number;
  percentual_acesso: number;
}

interface DocumentosTableProps {
  documentos: DocumentoComEstatisticas[];
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRowClick?: (id: string) => void;
}

type SortField = 'nome' | 'data' | 'percentual' | null;
type SortDirection = 'asc' | 'desc';

export default function DocumentosTable({
  documentos,
  selectedIds,
  setSelectedIds,
  onEdit,
  onDelete,
  onRowClick
}: DocumentosTableProps) {
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

  const sortedDocumentos = [...documentos].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;

    switch (sortField) {
      case 'nome':
        comparison = a.titulo.localeCompare(b.titulo);
        break;
      case 'data':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'percentual':
        comparison = a.percentual_acesso - b.percentual_acesso;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedDocumentos.map(d => d.id));
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

  const isAllSelected = sortedDocumentos.length > 0 && selectedIds.length === sortedDocumentos.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedDocumentos.length;

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

  const formatarTamanho = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTipoIcon = (tipo: string | null) => {
    if (!tipo) return '📄';
    if (tipo.toUpperCase().includes('PDF')) return '📕';
    if (tipo.toUpperCase().includes('DOC')) return '📘';
    return '📄';
  };

  if (sortedDocumentos.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg mb-2">Nenhum documento encontrado</p>
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
              onClick={() => handleSort('nome')}
            >
              <div className="flex items-center gap-2">
                Nome do Arquivo
                <SortIcon field="nome" />
              </div>
            </th>
            <th className="px-4 py-2 text-gray-300 font-medium">
              Tipo
            </th>
            <th 
              className="px-4 py-2 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('data')}
            >
              <div className="flex items-center gap-2">
                Data
                <SortIcon field="data" />
              </div>
            </th>
            <th 
              className="px-4 py-2 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('percentual')}
            >
              <div className="flex items-center gap-2">
                % de Acesso
                <SortIcon field="percentual" />
              </div>
            </th>
            <th className="px-4 py-2 text-gray-300 font-medium text-right">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedDocumentos.map((documento) => {
            const isSelected = selectedIds.includes(documento.id);

            return (
              <tr
                key={documento.id}
                onClick={() => onRowClick?.(documento.id)}
                className={`hover:bg-gray-800/30 transition cursor-pointer ${isSelected ? 'bg-gray-800/50' : ''}`}
              >
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(documento.id, e)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <div>
                    <p className="font-medium text-white truncate max-w-[300px]">{documento.titulo}</p>
                    {documento.descricao && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[300px]">{documento.descricao}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {documento.tipo_destinatario === 'geral' ? 'Geral' : 
                       documento.tipo_destinatario === 'cargo' ? `Cargo: ${documento.valor_destinatario}` : 
                       'Privado'}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTipoIcon(documento.tipo_arquivo)}</span>
                    <span className="text-gray-300 text-xs">{documento.tipo_arquivo || '-'}</span>
                    {documento.tamanho_bytes && (
                      <span className="text-gray-500 text-xs">({formatarTamanho(documento.tamanho_bytes)})</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-300">
                  {formatarData(documento.created_at)}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-[100px]">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            documento.percentual_acesso === 100
                              ? 'bg-green-500'
                              : documento.percentual_acesso >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${documento.percentual_acesso}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-medium min-w-[45px] text-right ${
                      documento.percentual_acesso === 100
                        ? 'text-green-500'
                        : documento.percentual_acesso >= 50
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}>
                      {documento.percentual_acesso}%
                    </span>
                    <span className="text-xs text-gray-400">
                      ({documento.total_acessos}/{documento.total_destinatarios})
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {documento.arquivo_url && (
                      <a
                        href={documento.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Download"
                        className="p-1.5 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(documento.id);
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
                        if (window.confirm('Deseja realmente excluir este documento?')) {
                          onDelete(documento.id);
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

