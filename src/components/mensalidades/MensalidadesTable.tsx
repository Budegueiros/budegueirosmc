import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import StatusBadge from './StatusBadge';
import TableRowActions from './TableRowActions';
import { formatarValor, formatarData, calcularDiasAtraso } from '../../utils/mensalidadesHelpers';

interface Mensalidade {
  id: string;
  membro_id: string;
  mes_referencia: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  link_cobranca: string | null;
  forma_pagamento: string | null;
  observacao: string | null;
  membros: {
    nome_completo: string;
    nome_guerra: string;
    numero_carteira: string;
  };
}

interface MensalidadesTableProps {
  mensalidades: Mensalidade[];
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onRowClick?: (id: string) => void;
}

type SortField = 'nome' | 'vencimento' | 'valor' | null;
type SortDirection = 'asc' | 'desc';

export default function MensalidadesTable({
  mensalidades,
  selectedIds,
  setSelectedIds,
  onDelete,
  onEdit,
  onRowClick
}: MensalidadesTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedMensalidades = [...mensalidades].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;

    switch (sortField) {
      case 'nome':
        comparison = a.membros.nome_guerra.localeCompare(b.membros.nome_guerra);
        break;
      case 'vencimento':
        // Criar datas no timezone local para evitar problemas de timezone
        const dateStrA = a.data_vencimento.split('T')[0];
        const [anoA, mesA, diaA] = dateStrA.split('-').map(Number);
        const dateA = new Date(anoA, mesA - 1, diaA);
        
        const dateStrB = b.data_vencimento.split('T')[0];
        const [anoB, mesB, diaB] = dateStrB.split('-').map(Number);
        const dateB = new Date(anoB, mesB - 1, diaB);
        
        comparison = dateA.getTime() - dateB.getTime();
        break;
      case 'valor':
        comparison = a.valor - b.valor;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedMensalidades.map(m => m.id));
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

  const isAllSelected = sortedMensalidades.length > 0 && selectedIds.length === sortedMensalidades.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedMensalidades.length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-500 opacity-0" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-white" />
      : <ChevronDown className="w-4 h-4 text-white" />;
  };

  if (sortedMensalidades.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg mb-2">Nenhuma mensalidade encontrada</p>
        <p className="text-gray-500 text-sm">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-800 border-b border-gray-700">
          <tr>
            <th className="px-4 py-3 text-gray-300 font-medium w-12 text-center">#</th>
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
            <th className="px-4 py-3 text-gray-300 font-medium">
              Endereço
            </th>
            <th 
              className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('vencimento')}
            >
              <div className="flex items-center gap-2">
                Vencimento
                <SortIcon field="vencimento" />
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
            <th className="px-4 py-3 text-gray-300 font-medium">
              Status
            </th>
            <th className="px-4 py-3 text-gray-300 font-medium text-right">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedMensalidades.map((mensalidade, index) => {
            const isSelected = selectedIds.includes(mensalidade.id);
            const diasAtraso = calcularDiasAtraso(mensalidade);

            return (
              <tr
                key={mensalidade.id}
                onClick={() => onRowClick?.(mensalidade.id)}
                className={`hover:bg-gray-800/30 transition cursor-pointer ${isSelected ? 'bg-gray-800/50' : ''}`}
              >
                <td className="px-4 py-3 text-gray-400 text-center text-sm">
                  {index + 1}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(mensalidade.id, e)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{mensalidade.membros.nome_guerra}</p>
                    <p className="text-xs text-gray-400">Carteira: {mensalidade.membros.numero_carteira}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-400 truncate max-w-[200px]" title={mensalidade.membros.nome_completo}>
                    {mensalidade.membros.nome_completo}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {formatarData(mensalidade.data_vencimento)}
                </td>
                <td className="px-4 py-3 text-white font-medium">
                  {formatarValor(mensalidade.valor)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={mensalidade.status} diasAtraso={diasAtraso > 0 ? diasAtraso : undefined} />
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <TableRowActions
                    mensalidadeId={mensalidade.id}
                    onEdit={onEdit || (() => {})}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

