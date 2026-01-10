/**
 * Componente para exibir as motos do membro no Dashboard
 */
import { Link } from 'react-router-dom';
import { GiFullMotorcycleHelmet } from 'react-icons/gi';
import { Gauge } from 'lucide-react';
import { MotoData } from '../../services/motoService';

interface MinhasMaquinasCardProps {
  motos: MotoData[];
  kmAnual: number;
}

export function MinhasMaquinasCard({ motos, kmAnual }: MinhasMaquinasCardProps) {
  if (motos.length === 0) {
    return (
      <div className="h-full">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 overflow-hidden h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-5 py-4">
            <h3 className="text-white font-oswald text-base uppercase font-bold flex items-center gap-2">
              <GiFullMotorcycleHelmet className="w-5 h-5 text-brand-red" />
              MINHA MÁQUINA
            </h3>
          </div>

          <div className="p-5 flex-1 flex flex-col items-center justify-center">
            <GiFullMotorcycleHelmet className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-6">Nenhuma moto cadastrada</p>

            {/* KM Rodados no Ano - mesmo quando não há motos */}
            <div className="bg-[#0A0A10] rounded-lg border border-gray-800 p-4 mb-6 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#4CAF50]/20 p-2 rounded-lg">
                    <Gauge className="w-5 h-5 text-[#4CAF50]" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase font-oswald mb-1">
                      KM RODADOS EM {new Date().getFullYear()}
                    </p>
                    <p className="text-[#4CAF50] font-oswald text-2xl font-bold">
                      {kmAnual.toLocaleString('pt-BR')} <span className="text-base text-gray-400">km</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/add-moto"
              className="block w-full bg-[#661A1A] hover:bg-[#771A1A] border border-[#CC3333] text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition text-center"
            >
              + CADASTRAR NOVA MOTO
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-red/20 to-transparent border-b border-gray-800 px-5 py-4">
          <h3 className="text-white font-oswald text-base uppercase font-bold flex items-center gap-2">
            <GiFullMotorcycleHelmet className="w-5 h-5 text-brand-red" />
            {motos.length > 1 ? 'MINHAS MÁQUINAS' : 'MINHA MÁQUINA'}
          </h3>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          {/* Cards de Motos */}
          <div className="space-y-3 mb-5 flex-1 overflow-y-auto">
            {motos.map((moto, index) => (
              <div
                key={moto.id}
                className="bg-[#0A0A10] rounded-lg border border-gray-800 p-4 hover:border-gray-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500 text-sm">{index + 1}.</span>
                    </div>
                    <h4 className="text-white font-oswald text-lg uppercase font-bold mb-1">
                      {moto.marca} {moto.modelo}
                    </h4>
                    <p className="text-gray-400 text-xs">
                      <span className="font-mono">{moto.placa}</span> • {moto.ano}
                    </p>
                  </div>
                  <Link
                    to={`/edit-moto/${moto.id}`}
                    className="text-white hover:text-brand-red transition text-xs uppercase font-oswald font-bold"
                  >
                    EDITAR
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* KM Rodados no Ano */}
          <div className="bg-[#0A0A10] rounded-lg border border-gray-800 p-4 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#4CAF50]/20 p-2 rounded-lg">
                  <Gauge className="w-5 h-5 text-[#4CAF50]" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-oswald mb-1">
                    KM RODADOS EM {new Date().getFullYear()}
                  </p>
                  <p className="text-[#4CAF50] font-oswald text-2xl font-bold">
                    {kmAnual.toLocaleString('pt-BR')} <span className="text-base text-gray-400">km</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Adicionar Nova Moto */}
          <Link
            to="/add-moto"
            className="block w-full bg-[#661A1A] hover:bg-[#771A1A] border border-[#CC3333] text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition text-center"
          >
            + CADASTRAR NOVA MOTO
          </Link>
        </div>
      </div>
    </div>
  );
}
