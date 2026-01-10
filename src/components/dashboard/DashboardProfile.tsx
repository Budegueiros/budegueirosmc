/**
 * Componente para exibir o perfil do membro no Dashboard
 */
import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, Users, Shield, Droplet } from 'lucide-react';
import { MembroComCargos } from '../../types/database.types';

interface DashboardProfileProps {
  membro: MembroComCargos;
}

/**
 * Formata uma data para formato brasileiro
 */
function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('T')[0].split('-');
  return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia)).toLocaleDateString('pt-BR');
}

export function DashboardProfile({ membro }: DashboardProfileProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Foto */}
          <div className="relative flex-shrink-0 mx-auto lg:mx-0">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center overflow-hidden">
              {membro.foto_url ? (
                <img src={membro.foto_url} alt={membro.nome_guerra} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500 text-4xl lg:text-6xl font-bold">{membro.nome_guerra[0]}</span>
              )}
            </div>
          </div>

          {/* Informações */}
          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3 lg:mb-4">
              <div className="text-center lg:text-left">
                <h2 className="text-white font-oswald text-3xl lg:text-5xl uppercase font-bold leading-none">
                  {membro.nome_guerra}
                </h2>
                <p className="text-gray-400 text-base lg:text-lg mt-1">{membro.endereco_cidade || 'Brasiliado'}</p>
              </div>
              <Link
                to="/edit-profile"
                className="text-gray-400 hover:text-white flex items-center gap-2 text-sm justify-center lg:justify-start mt-2 lg:mt-0"
              >
                <User className="w-4 h-4" />
                Editar Perfil
              </Link>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4 lg:mb-6 justify-center lg:justify-start">
              {membro.endereco_estado && (
                <span className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded text-xs font-oswald uppercase">
                  {membro.endereco_estado}
                </span>
              )}
              {membro.cargos && membro.cargos.map((cargo) => (
                <span key={cargo.id} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded text-xs font-oswald uppercase">
                  {cargo.nome}
                </span>
              ))}
            </div>

            {/* Informações Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="uppercase">Localização</span>
                </div>
                <p className="text-white font-semibold text-sm lg:text-base">
                  {membro.endereco_cidade && membro.endereco_estado
                    ? `${membro.endereco_cidade} - ${membro.endereco_estado}`
                    : 'Não informado'}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="uppercase">Integrante desde</span>
                </div>
                <p className="text-white font-semibold text-sm lg:text-base">
                  {membro.data_inicio ? formatarData(membro.data_inicio) : 'Não informado'}
                </p>
              </div>
              {membro.conjuge && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-1">
                    <Users className="w-4 h-4" />
                    <span className="uppercase">Cônjuge</span>
                  </div>
                  <p className="text-white font-semibold text-sm lg:text-base">
                    {membro.conjuge.nome_guerra || membro.conjuge.nome_completo.split(' ')[0]}
                  </p>
                </div>
              )}
              {membro.tipo_sanguineo && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-1">
                    <Droplet className="w-4 h-4" />
                    <span className="uppercase">Tipo Sanguíneo</span>
                  </div>
                  <p className="text-[#FF6B6B] font-semibold text-sm lg:text-base font-mono">
                    {membro.tipo_sanguineo}
                  </p>
                </div>
              )}
              {membro.padrinho && membro.padrinho.nome_guerra && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="uppercase">Padrinho</span>
                  </div>
                  <p className="text-white font-semibold text-sm lg:text-base">{membro.padrinho.nome_guerra}</p>
                </div>
              )}
              <div
                className={
                  membro.conjuge || membro.tipo_sanguineo || (membro.padrinho && membro.padrinho.nome_guerra)
                    ? ''
                    : 'lg:col-span-2'
                }
              >
                <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-1">
                  <Shield className="w-4 h-4" />
                  <span className="uppercase">Nº Integrante</span>
                </div>
                <p className="text-brand-red font-mono font-bold text-base lg:text-lg">{membro.numero_carteira}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
