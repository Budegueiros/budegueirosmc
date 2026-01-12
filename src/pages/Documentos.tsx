import { useState, useEffect, useCallback } from 'react';
import { Filter, Loader2, FileText } from 'lucide-react';
import { membroService } from '../services/membroService';
import { documentoService } from '../services/documentoService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import DocumentoCard from '../components/DocumentoCard';
import { DocumentoComAutor } from '../types/database.types';
import DashboardLayout from '../components/DashboardLayout';
import { handleSupabaseError } from '../utils/errorHandler';

type FiltroTipo = 'todos' | 'nao-acessados' | 'meus-documentos';

export default function Documentos() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [documentos, setDocumentos] = useState<DocumentoComAutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroTipo>('todos');
  const [membroId, setMembroId] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Buscar membro
      const membroData = await membroService.buscarPorUserId(user.id);
      if (!membroData) return;

      setMembroId(membroData.id);

      // Buscar documentos com status de acesso
      // Extrair cargos do membro para filtrar documentos por cargo
      const cargosIds = membroData.cargos.map((c) => c.id);
      const documentosComAcesso = await documentoService.buscarComStatusAcesso(
        membroData.id,
        membroData.nome_guerra,
        cargosIds
      );

      setDocumentos(documentosComAcesso);
    } catch (error) {
      const appError = handleSupabaseError(error);
      console.error('Erro ao carregar documentos:', appError);
      toastError('Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  }, [user, toastError]);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user, carregarDados]);

  const handleMarcarComoAcessado = useCallback(async (documentoId: string) => {
    if (!membroId) return;

    try {
      await documentoService.marcarComoAcessado(documentoId, membroId);

      // Atualizar estado local
      setDocumentos((prev) =>
        prev.map((d) => (d.id === documentoId ? { ...d, ja_acessado: true } : d))
      );
    } catch (error) {
      // Erro já foi tratado no service (ignora duplicatas)
      console.error('Erro ao marcar como acessado:', error);
    }
  }, [membroId]);

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

