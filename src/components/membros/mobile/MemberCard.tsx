import { Eye, Edit2, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Membro } from '../../../types/database.types';
import { STATUS_STYLES } from '../../../types/database.types';

interface MembroWithCargos extends Membro {
  cargos_ativos?: Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
  }>;
}

interface MemberCardProps {
  member: MembroWithCargos;
  onView: (memberId: string) => void;
  onEdit: (memberId: string) => void;
  onMoreActions: (memberId: string) => void;
  index?: number;
}

export default function MemberCard({ 
  member, 
  onView, 
  onEdit, 
  onMoreActions,
  index = 0
}: MemberCardProps) {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('brasionado')) return 'bg-green-500';
    if (statusLower.includes('prospect')) return 'bg-yellow-500';
    if (statusLower.includes('inativo') || statusLower.includes('aspirante')) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const statusStyle = STATUS_STYLES[member.status_membro] || {
    bg: 'bg-gray-800',
    text: 'text-gray-300',
    label: member.status_membro,
  };

  const mainCargo = member.cargos_ativos?.[0]?.nome || 'Sem cargo';

  const delayClass = index < 5 ? `animate-delay-${index * 50}` : 'animate-delay-200';

  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-xl p-4 mx-4 mb-3 shadow-lg animate-slide-up ${delayClass}`}>
      {/* Header com Avatar e Status */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          {member.foto_url ? (
            <img
              src={member.foto_url}
              alt={member.nome_guerra}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {member.nome_guerra.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate">
              {member.nome_guerra}
            </h3>
            {member.is_admin && (
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                ADMIN
              </span>
            )}
          </div>
          <div
            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}
          >
            {statusStyle.label.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Detalhes do Membro */}
      <div className="space-y-2 mb-4 pt-3 border-t border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">🎫</span>
          <span className="text-gray-300">
            #{member.numero_carteira} - {mainCargo}
          </span>
        </div>

        {(member.endereco_cidade || member.endereco_estado) && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">📍</span>
            <span className="text-gray-300">
              {member.endereco_cidade || ''}
              {member.endereco_cidade && member.endereco_estado && ' - '}
              {member.endereco_estado || ''}
            </span>
          </div>
        )}

        {member.tipo_sanguineo && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">💉</span>
            <span className="text-red-400 font-semibold">
              {member.tipo_sanguineo}
            </span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={() => onView(member.id)}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition min-h-[60px]"
        >
          <Eye className="w-5 h-5" />
          <span className="text-xs font-semibold">Ver</span>
        </button>

        <button
          onClick={() => onEdit(member.id)}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg transition min-h-[60px]"
        >
          <Edit2 className="w-5 h-5" />
          <span className="text-xs font-semibold">Editar</span>
        </button>

        <button
          onClick={() => onMoreActions(member.id)}
          className="w-14 flex items-center justify-center bg-transparent hover:bg-gray-700 text-white py-2.5 rounded-lg transition min-h-[60px]"
          aria-label="Mais ações"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

