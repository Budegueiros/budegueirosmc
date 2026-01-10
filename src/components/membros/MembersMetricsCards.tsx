import { Users, Shield, UserCheck, UserX } from 'lucide-react';

interface MembersMetricsCardsProps {
  metrics: {
    totalIntegrantes: number;
    brasionados: number;
    prospects: number;
    inativos: number;
  };
}

export default function MembersMetricsCards({ metrics }: MembersMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Total de Integrantes */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Total de Integrantes</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.totalIntegrantes}
          </p>
          <p className="text-xs text-gray-500">Cadastrados</p>
        </div>
      </div>

      {/* Brasionados */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <Shield className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Brasionados</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.brasionados}
          </p>
          <p className="text-xs text-gray-500">Membros plenos</p>
        </div>
      </div>

      {/* Prospects */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <UserCheck className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Prospects</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.prospects}
          </p>
          <p className="text-xs text-gray-500">Em processo</p>
        </div>
      </div>

      {/* Inativos */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-500/10 rounded-lg">
            <UserX className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Inativos</p>
          <p className="text-3xl font-bold text-white mb-1">
            {metrics.inativos}
          </p>
          <p className="text-xs text-gray-500">Desativados</p>
        </div>
      </div>
    </div>
  );
}


