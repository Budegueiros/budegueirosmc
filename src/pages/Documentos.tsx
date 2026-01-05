import { useState, useEffect } from 'react';
import { Filter, Loader2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import DocumentoCard from '../components/DocumentoCard';
import { DocumentoComAutor } from '../types/database.types';
import DashboardLayout from '../components/DashboardLayout';

type FiltroTipo = 'todos' | 'nao-acessados' | 'meus-documentos';

export default function Documentos() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [documentos, setDocumentos] = useState<DocumentoComAutor[]>([]);
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
        .select('id, is_admin, nome_guerra')
        .eq('user_id', user.id)
        .single();

      if (membroError) throw membroError;
      if (!membroData) return;

      setMembroId(membroData.id);

      // Buscar documentos com informações do autor e status de acesso
      const { data: documentosData, error: documentosError } = await supabase
        .from('documentos')
        .select(`
          *,
          autor:membros!documentos_membro_id_autor_fkey (
            nome_guerra,
            foto_url
          )
        `)
        .order('created_at', { ascending: false });

      if (documentosError) throw documentosError;

      // Buscar acessos do membro
      const { data: acessosData } = await supabase
        .from('documentos_acesso')
        .select('documento_id')
        .eq('membro_id', membroData.id);

      const idsAcessados = new Set(acessosData?.map((a) => a.documento_id) || []);

      // Filtrar documentos baseado no tipo de destinatário
      const documentosFiltrados = (documentosData || []).filter((doc: any) => {
        if (doc.tipo_destinatario === 'geral') return true;
        if (doc.tipo_destinatario === 'cargo') {
          // Verificar se o membro tem o cargo
          // Isso precisa ser verificado de forma diferente, por enquanto aceita todos
          // TODO: Implementar verificação de cargo
          return true;
        }
        if (doc.tipo_destinatario === 'membro') {
          // Verificar se é para este membro específico (comparar nome de guerra)
          return doc.valor_destinatario?.toUpperCase() === membroData.nome_guerra?.toUpperCase();
        }
        return false;
      });

      // Mapear documentos com status de acesso
      const documentosComAcesso: DocumentoComAutor[] = documentosFiltrados.map((d: any) => ({
        ...d,
        autor: d.autor || { nome_guerra: 'Desconhecido', foto_url: null },
        ja_acessado: idsAcessados.has(d.id)
      }));

      setDocumentos(documentosComAcesso);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toastError('Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarComoAcessado = async (documentoId: string) => {
    if (!membroId) return;

    try {
      const { error } = await supabase.from('documentos_acesso').insert({
        documento_id: documentoId,
        membro_id: membroId
      });

      if (error) throw error;

      // Atualizar estado local
      setDocumentos((prev) =>
        prev.map((d) => (d.id === documentoId ? { ...d, ja_acessado: true } : d))
      );
    } catch (error: any) {
      // Ignorar erro de duplicata (já foi marcado como acessado)
      if (error?.code !== '23505') {
        console.error('Erro ao marcar como acessado:', error);
      }
    }
  };

  const documentosFiltrados = documentos.filter((d) => {
    if (filtro === 'nao-acessados') return !d.ja_acessado;
    if (filtro === 'meus-documentos') return d.membro_id_autor === membroId;
    return true;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando documentos...</p>
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
            <FileText className="text-brand-red w-7 h-7 md:w-8 md:h-8" /> Documentos do Clube
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
            onClick={() => setFiltro('nao-acessados')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors flex-shrink-0 ${
              filtro === 'nao-acessados'
                ? 'bg-brand-red border-brand-red text-white'
                : 'bg-zinc-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Não Acessados
          </button>
          <button
            onClick={() => setFiltro('meus-documentos')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors flex-shrink-0 ${
              filtro === 'meus-documentos'
                ? 'bg-brand-red border-brand-red text-white'
                : 'bg-zinc-800 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Meus Documentos
          </button>
        </div>

        {/* Listagem de Documentos */}
        <div className="space-y-4">
          {documentosFiltrados.length > 0 ? (
            documentosFiltrados.map((documento) => (
              <DocumentoCard
                key={documento.id}
                documento={documento}
                onMarcarComoAcessado={handleMarcarComoAcessado}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-zinc-800/50 rounded border border-dashed border-gray-700 flex flex-col items-center">
              <Filter className="text-gray-600 mb-2" size={32} />
              <p className="text-gray-500">Nenhum documento encontrado para este filtro.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

