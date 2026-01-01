// ============================================================================
// Componente MembroCard
// ============================================================================
// Descrição: Componente para exibir cartão de membro com status e cargos
// Data: 2025-12-28
// ============================================================================

import { Shield, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { MembroComCargos } from '../hooks/useMembro';
import { STATUS_STYLES, TIPO_CARGO_STYLES } from '../types/database.types';

interface MembroCardProps {
  membro: MembroComCargos;
  className?: string;
  showDetails?: boolean;
  onClick?: () => void;
}

/**
 * Componente de cartão para exibir informações de um membro
 * 
 * @param membro - Dados do membro com cargos incluídos
 * @param className - Classes CSS adicionais
 * @param showDetails - Se true, mostra detalhes adicionais (padrão: true)
 * @param onClick - Callback quando o card for clicado
 * 
 * @example
 * ```tsx
 * <MembroCard 
 *   membro={membro} 
 *   onClick={() => navigate(`/membro/${membro.id}`)}
 * />
 * ```
 */
export default function MembroCard({ 
  membro, 
  className = '',
  showDetails = true,
  onClick 
}: MembroCardProps) {
  const formatarData = (data: string | null) => {
    if (!data) return null;
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <div
      className={`bg-brand-gray border border-brand-red/30 rounded-xl p-5 transition hover:border-brand-red/60 ${
        onClick ? 'cursor-pointer' : ''
      } ${!membro.ativo ? 'opacity-60' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Foto do Membro */}
        {membro.foto_url ? (
          <img
            src={membro.foto_url}
            alt={membro.nome_guerra}
            className="w-16 h-16 rounded-full object-cover border-2 border-brand-red/30"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-brand-red/30 flex items-center justify-center">
            <span className="text-2xl font-oswald font-bold text-brand-red">
              {membro.nome_guerra.charAt(0)}
            </span>
          </div>
        )}

        {/* Informações */}
        <div className="flex-1">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-white font-oswald text-xl uppercase font-bold flex items-center gap-2">
                {membro.nome_guerra}
                {membro.is_admin && (
                  <span className="inline-flex items-center gap-1 bg-brand-red/20 border border-brand-red/50 text-brand-red px-2 py-0.5 rounded text-xs font-oswald uppercase">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </h3>
              <p className="text-gray-400 text-sm">{membro.nome_completo}</p>
            </div>

            {!membro.ativo && (
              <span className="inline-flex items-center gap-1 bg-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs font-oswald uppercase">
                Inativo
              </span>
            )}
          </div>

          {/* Status e Cargos */}
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Badge de Status */}
            <span 
              className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                STATUS_STYLES[membro.status_membro].bg
              } ${STATUS_STYLES[membro.status_membro].text}`}
            >
              {membro.status_membro}
            </span>

            {/* Badges de Cargos */}
            {membro.cargos && membro.cargos.length > 0 && (
              <>
                {membro.cargos.map((cargo) => (
                  <span
                    key={cargo.id}
                    className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                      TIPO_CARGO_STYLES[cargo.tipo_cargo].bg
                    } ${TIPO_CARGO_STYLES[cargo.tipo_cargo].text}`}
                    title={cargo.descricao || cargo.tipo_cargo}
                  >
                    {cargo.nome}
                  </span>
                ))}
              </>
            )}
          </div>

          {/* Detalhes Adicionais */}
          {showDetails && (
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              {/* Email */}
              {membro.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{membro.email}</span>
                </div>
              )}

              {/* Número da Carteira */}
              <div className="flex items-center gap-1">
                <span className="text-brand-red">🎫</span>
                <span>{membro.numero_carteira}</span>
              </div>

              {/* Padrinho */}
              {membro.padrinho && (
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Padrinho: {membro.padrinho.nome_guerra}</span>
                </div>
              )}

              {/* Data de Início */}
              {membro.data_inicio && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatarData(membro.data_inicio)}</span>
                </div>
              )}

              {/* Telefone */}
              {membro.telefone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{membro.telefone}</span>
                </div>
              )}

              {/* Localização */}
              {(membro.endereco_cidade || membro.endereco_estado) && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {membro.endereco_cidade && membro.endereco_estado
                      ? `${membro.endereco_cidade} - ${membro.endereco_estado}`
                      : membro.endereco_cidade || membro.endereco_estado}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Variante compacta do cartão de membro
 */
export function MembroCardCompact({ membro, onClick }: MembroCardProps) {
  return (
    <div
      className={`bg-brand-gray border border-brand-red/30 rounded-lg p-3 transition hover:border-brand-red/60 ${
        onClick ? 'cursor-pointer' : ''
      } ${!membro.ativo ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Avatar Compacto */}
        {membro.foto_url ? (
          <img
            src={membro.foto_url}
            alt={membro.nome_guerra}
            className="w-10 h-10 rounded-full object-cover border-2 border-brand-red/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-brand-red/30 flex items-center justify-center">
            <span className="text-lg font-oswald font-bold text-brand-red">
              {membro.nome_guerra.charAt(0)}
            </span>
          </div>
        )}

        {/* Info Compacta */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-oswald text-sm uppercase font-bold truncate flex items-center gap-2">
            {membro.nome_guerra}
            {membro.is_admin && (
              <Shield className="w-3 h-3 text-brand-red flex-shrink-0" />
            )}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span 
              className={`inline-flex px-1.5 py-0.5 rounded text-xs ${
                STATUS_STYLES[membro.status_membro].bg
              } ${STATUS_STYLES[membro.status_membro].text}`}
            >
              {membro.status_membro}
            </span>
            {membro.cargos && membro.cargos.length > 0 && (
              <span className="text-xs text-gray-500">
                • {membro.cargos.length} cargo{membro.cargos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
