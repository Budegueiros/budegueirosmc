import { X, Users, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface MembroConfirmado {
  id: string;
  nome_guerra: string;
  vai_com_budegueira: boolean;
  quantidade_visitantes: number | null;
}

interface MembrosConfirmadosModalProps {
  eventId: string;
  eventoNome: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MembrosConfirmadosModal({ 
  eventId, 
  eventoNome,
  isOpen, 
  onClose 
}: MembrosConfirmadosModalProps) {
  const [membros, setMembros] = useState<MembroConfirmado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchMembrosConfirmados();
    }
  }, [isOpen, eventId]);

  const fetchMembrosConfirmados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('confirmacoes_presenca')
        .select(`
          membro_id,
          vai_com_budegueira,
          quantidade_visitantes,
          membros!inner (
            id,
            nome_guerra
          )
        `)
        .eq('evento_id', eventId)
        .eq('status', 'Confirmado')
        .order('membros(nome_guerra)', { ascending: true });

      if (error) throw error;

      const membrosFormatados = (data || []).map((item: any) => ({
        id: item.membros.id,
        nome_guerra: item.membros.nome_guerra,
        vai_com_budegueira: item.vai_com_budegueira,
        quantidade_visitantes: item.quantidade_visitantes
      }));

      setMembros(membrosFormatados);
    } catch (error) {
      console.error('Erro ao buscar membros confirmados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalBudegueiras = membros.filter(m => m.vai_com_budegueira).length;
  const totalVisitantes = membros.reduce((acc, m) => acc + (m.quantidade_visitantes || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#1a1d23] rounded-lg max-w-md w-full max-h-[80vh] flex flex-col border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Confirmados</h2>
            <p className="text-sm text-gray-400">{eventoNome}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : membros.length > 0 ? (
            <div className="space-y-4">
              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#0f1014] border border-gray-800 rounded-lg p-3 text-center">
                  <Users className="w-4 h-4 mx-auto mb-1 text-red-500" />
                  <p className="text-lg font-bold text-white">{membros.length}</p>
                  <p className="text-xs text-gray-500">Membros</p>
                </div>
                {totalBudegueiras > 0 && (
                  <div className="bg-[#0f1014] border border-gray-800 rounded-lg p-3 text-center">
                    <User className="w-4 h-4 mx-auto mb-1 text-pink-500" />
                    <p className="text-lg font-bold text-white">{totalBudegueiras}</p>
                    <p className="text-xs text-gray-500">Budegueiras</p>
                  </div>
                )}
                {totalVisitantes > 0 && (
                  <div className="bg-[#0f1014] border border-gray-800 rounded-lg p-3 text-center">
                    <User className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold text-white">{totalVisitantes}</p>
                    <p className="text-xs text-gray-500">Visitantes</p>
                  </div>
                )}
              </div>

              {/* Lista de Membros */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Lista de Confirmados</h3>
                {membros.map((membro) => (
                  <div 
                    key={membro.id}
                    className="bg-[#0f1014] border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center border border-red-600/50">
                          <User className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="text-white font-medium">{membro.nome_guerra}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {membro.vai_com_budegueira && (
                          <span className="text-xs bg-pink-600/20 text-pink-400 px-2 py-1 rounded border border-pink-600/50">
                            +1 Budegueira
                          </span>
                        )}
                        {membro.quantidade_visitantes && membro.quantidade_visitantes > 0 && (
                          <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/50">
                            +{membro.quantidade_visitantes} {membro.quantidade_visitantes === 1 ? 'Visitante' : 'Visitantes'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Nenhuma confirmação ainda</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#0f1014] border border-gray-700 text-white rounded-lg hover:border-gray-600 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
