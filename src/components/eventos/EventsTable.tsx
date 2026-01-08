import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import EventStatusBadge from './EventStatusBadge';
import EventTableRowActions from './EventTableRowActions';

interface Evento {
  id: string;
  nome: string;
  tipo_evento: string;
  data_evento: string;
  hora_saida: string | null;
  local_saida: string;
  cidade: string;
  estado: string;
  status: string;
}

interface EventsTableProps {
  eventos: Evento[];
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onDelete: (id: string, nome: string) => void;
  onEdit: (id: string) => void;
}

type SortField = 'nome' | 'data' | 'tipo' | null;
type SortDirection = 'asc' | 'desc';

export default function EventsTable({
  eventos,
  selectedIds,
  setSelectedIds,
  onDelete,
  onEdit
}: EventsTableProps) {
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

  const sortedEventos = [...eventos].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;

    switch (sortField) {
      case 'nome':
        comparison = a.nome.localeCompare(b.nome);
        break;
      case 'data':
        const dateA = new Date(a.data_evento);
        const dateB = new Date(b.data_evento);
        comparison = dateA.getTime() - dateB.getTime();
        break;
      case 'tipo':
        comparison = a.tipo_evento.localeCompare(b.tipo_evento);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedEventos.map(e => e.id));
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

  const isAllSelected = sortedEventos.length > 0 && selectedIds.length === sortedEventos.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedEventos.length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-500 opacity-0" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-white" />
      : <ChevronDown className="w-4 h-4 text-white" />;
  };

  const formatarData = (data: string) => {
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const formatarDataHora = (data: string, hora: string | null) => {
    const date = new Date(data + 'T00:00:00');
    const dataFormatada = date.toLocaleDateString('pt-BR');
    if (hora) {
      return `${dataFormatada} ${hora}`;
    }
    return dataFormatada;
  };

  if (sortedEventos.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg mb-2">Nenhum evento encontrado</p>
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
                Nome do Evento
                <SortIcon field="nome" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('tipo')}
            >
              <div className="flex items-center gap-2">
                Tipo
                <SortIcon field="tipo" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-gray-300 font-medium cursor-pointer hover:bg-gray-700/50 transition"
              onClick={() => handleSort('data')}
            >
              <div className="flex items-center gap-2">
                Data/Hora
                <SortIcon field="data" />
              </div>
            </th>
            <th className="px-4 py-3 text-gray-300 font-medium">
              Localização
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
          {sortedEventos.map((evento, index) => {
            const isSelected = selectedIds.includes(evento.id);

            return (
              <tr
                key={evento.id}
                className={`hover:bg-gray-800/30 transition ${isSelected ? 'bg-gray-800/50' : ''}`}
              >
                <td className="px-4 py-3 text-gray-400 text-center text-sm">
                  {index + 1}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectOne(evento.id, e)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{evento.nome}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {evento.tipo_evento}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {formatarDataHora(evento.data_evento, evento.hora_saida)}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {evento.cidade} - {evento.estado}
                </td>
                <td className="px-4 py-3">
                  <EventStatusBadge status={evento.status} />
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <EventTableRowActions
                    eventoId={evento.id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    eventoNome={evento.nome}
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

