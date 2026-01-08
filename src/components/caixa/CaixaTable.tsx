import { useState } from 'react';
import { Trash2, Edit2, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { FluxoCaixaComMembro } from '../../types/database.types';
import CategoriaBadge from './CategoriaBadge';

interface CaixaTableProps {
  lancamentos: FluxoCaixaComMembro[];
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onDelete: (id: string) => void;
  onEdit?: (lancamento: FluxoCaixaComMembro) => void;
  onViewAnexo?: (url: string, fileName?: string) => void;
}

type SortField = 'data' | 'descricao' | 'categoria' | 'valor' | null;
type SortDirection = 'asc' | 'desc';

export default function CaixaTable({ lancamentos, selectedIds, setSelectedIds, onDelete, onEdit, onViewAnexo }: CaixaTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const formatarValor = (valor: number, tipo: 'entrada' | 'saida') => {
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(valor);

    return tipo === 'entrada' 
      ? <span className="text-emerald-400 font-bold">+{valorFormatado}</span>
      : <span className="text-rose-500 font-bold">-{valorFormatado}</span>;
  };

  const formatarData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLancamentos = [...lancamentos].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;

    switch (sortField) {
      case 'data':
        // Comparar datas diretamente como strings (formato YYYY-MM-DD)
        comparison = a.data.localeCompare(b.data);
        break;
      case 'descricao':
        comparison = a.descricao.localeCompare(b.descricao);
        break;
      case 'categoria':
        comparison = a.categoria.localeCompare(b.categoria);
        break;
      case 'valor':
        comparison = a.valor - b.valor;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-500 opacity-0" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-white" />
      : <ChevronDown className="w-4 h-4 text-white" />;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedLancamentos.map(l => l.id));
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

  const isAllSelected = sortedLancamentos.length > 0 && selectedIds.length === sortedLancamentos.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedLancamentos.length;

  if (sortedLancamentos.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg mb-2">Nenhum lançamento encontrado</p>
        <p className="text-gray-500 text-sm">Registre uma entrada ou saída para começar</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-800 border-b border-gray-700">
          <tr>
            <th className="px-4 py-3 text-gray-300 font-medium w-12 text-center">#</th>
            <th className="px-4 py-3 text-gray-300 font-medium w-12">
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
              onClick={() => handleSort('data')}
            >
              <div className="flex items-center gap-2">
                Data
                <SortIcon field="data" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('descricao')}
            >
              <div className="flex items-center gap-2">
                Descrição
                <SortIcon field="descricao" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('categoria')}
            >
              <div className="flex items-center gap-2">
                Categoria
                <SortIcon field="categoria" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('valor')}
            >
              <div className="flex items-center gap-2">
                Valor
                <SortIcon field="valor" />
              </div>
            </th>
            <th className="px-4 py-3 text-gray-300 font-medium text-center">Anexo</th>
            <th className="px-4 py-3 text-gray-300 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedLancamentos.map((lancamento, index) => {
            const isSelected = selectedIds.includes(lancamento.id);
            return (
              <tr
                key={lancamento.id}
                className={`hover:bg-gray-800/30 transition ${isSelected ? 'bg-gray-800/50' : ''}`}
              >
                <td className="px-4 py-3 text-gray-400 text-center text-sm">
                  {index + 1}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(lancamento.id, e)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {formatarData(lancamento.data)}
                </td>
              <td className="px-4 py-3">
                <div>
                  <p className="text-white font-medium">{lancamento.descricao}</p>
                  <p className="text-xs text-gray-400">Por: {lancamento.membros.nome_guerra}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <CategoriaBadge categoria={lancamento.categoria} />
              </td>
              <td className="px-4 py-3">
                {formatarValor(lancamento.valor, lancamento.tipo)}
              </td>
              <td className="px-4 py-3 text-center">
                {lancamento.anexo_url ? (
                  <button
                    onClick={() => onViewAnexo?.(lancamento.anexo_url!, lancamento.descricao)}
                    className="inline-flex items-center justify-center w-8 h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition"
                    title="Ver comprovante"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                ) : lancamento.tipo === 'saida' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                    Pendente
                  </span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(lancamento);
                      }}
                      className="inline-flex items-center justify-center w-8 h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition"
                      title="Editar lançamento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(lancamento.id);
                    }}
                    className="inline-flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                    title="Excluir lançamento"
                  >
                    <Trash2 className="w-4 h-4" />
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

