import { useState, useEffect } from 'react';
import { Bell, Filter, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ComunicadoCard from '../components/ComunicadoCard';
import { ComunicadoComAutor } from '../types/database.types';
import DashboardLayout from '../components/DashboardLayout';

type FiltroTipo = 'todos' | 'nao-lidos' | 'importantes';

export default function Comunicados() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [comunicados, setComunicados] = useState<ComunicadoComAutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroTipo>('todos');
  const [membroId, setMembroId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  const carregarDados = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar membro
      const { data: membroData, error: membroError } = await supabase
        .from('membros')
        .select('id, is_admin')
        .eq('user_id', user.id)
        .single();

      if (membroError) throw membroError;
      if (!membroData) return;

      setMembroId(membroData.id);

      // Buscar comunicados com informações do autor e status de leitura
      const { data: comunicadosData, error: comunicadosError } = await supabase
        .from('comunicados')
        .select(`
          *,
          autor:membros!comunicados_membro_id_autor_fkey (
            nome_guerra,
            foto_url
          )
        `)
        .order('created_at', { ascending: false });

      if (comunicadosError) throw comunicadosError;

      // Buscar leituras do membro
      const { data: leiturasData } = await supabase
        .from('comunicados_leitura')
        .select('comunicado_id')
        .eq('membro_id', membroData.id);

      const idsLidos = new Set(leiturasData?.map((l) => l.comunicado_id) || []);

      // Mapear comunicados com status de leitura
      const comunicadosComLeitura: ComunicadoComAutor[] =
        comunicadosData?.map((c: any) => ({
          ...c,
          autor: c.autor || { nome_guerra: 'Desconhecido', foto_url: null },
          ja_lido: idsLidos.has(c.id)
        })) || [];

      setComunicados(comunicadosComLeitura);
    } catch (error) {
      console.error('Erro ao carregar comunicados:', error);
      toastError('Erro ao carregar comunicados.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarComoLido = async (comunicadoId: string) => {
    if (!membroId) return;

    try {
      const { error } = await supabase.from('comunicados_leitura').insert({
        comunicado_id: comunicadoId,
        membro_id: membroId
      });

      if (error) throw error;

      // Atualizar estado local
      setComunicados((prev) =>
        prev.map((c) => (c.id === comunicadoId ? { ...c, ja_lido: true } : c))
      );
    } catch (error: any) {
      // Ignorar erro de duplicata (já foi marcado como lido)
      if (error?.code !== '23505') {
        console.error('Erro ao marcar como lido:', error);
      }
    }
  };

  const comunicadosFiltrados = comunicados.filter((c) => {
    if (filtro === 'nao-lidos') return !c.ja_lido;
    if (filtro === 'importantes') return c.prioridade === 'alta' || c.prioridade === 'critica';
    return true;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando comunicados...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 font-oswald uppercase">
            <Bell className="text-brand-red w-7 h-7 md:w-8 md:h-8" /> Mural de Comunicados
          </h2>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors flex-shrink-0 ${
              filtro === 'todos'
                ? 'bg-brand-red border-brand-red text-white'
                : 'bg-zinc-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltro('nao-lidos')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors flex-shrink-0 ${
              filtro === 'nao-lidos'
                ? 'bg-brand-red border-brand-red text-white'
                : 'bg-zinc-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Não Lidos
          </button>
          <button
            onClick={() => setFiltro('importantes')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors flex-shrink-0 ${
              filtro === 'importantes'
                ? 'bg-brand-red border-brand-red text-white'
                : 'bg-zinc-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Importantes / Urgentes
          </button>
        </div>

        {/* Listagem de Comunicados */}
        <div className="space-y-4">
          {comunicadosFiltrados.length > 0 ? (
            comunicadosFiltrados.map((comunicado) => (
              <ComunicadoCard
                key={comunicado.id}
                comunicado={comunicado}
                onMarcarComoLido={handleMarcarComoLido}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-zinc-800/50 rounded border border-dashed border-gray-700 flex flex-col items-center">
              <Filter className="text-gray-600 mb-2" size={32} />
              <p className="text-gray-500">Nenhum comunicado encontrado para este filtro.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
