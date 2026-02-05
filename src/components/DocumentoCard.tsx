import { FileText, Download, Eye, CheckCheck } from 'lucide-react';
import { DocumentoComAutor } from '../types/database.types';

interface DocumentoCardProps {
  documento: DocumentoComAutor;
  onMarcarComoAcessado: (id: string) => void;
  onVisualizar?: (documento: DocumentoComAutor) => void;
}

export default function DocumentoCard({ documento, onMarcarComoAcessado, onVisualizar }: DocumentoCardProps) {
  const getDestinatarioLabel = () => {
    if (documento.tipo_destinatario === 'geral') return 'GERAL';
    if (documento.tipo_destinatario === 'cargo') {
      return `CARGO: ${documento.valor_destinatario}`;
    }
    return 'DOCUMENTO PRIVADO';
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarTamanho = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    window.open(documento.arquivo_url, '_blank');
    if (!documento.ja_acessado) {
      onMarcarComoAcessado(documento.id);
    }
  };

  const handleVisualizar = () => {
    if (onVisualizar) {
      onVisualizar(documento);
    }
  };

  return (
    <div
      className={`rounded-lg border p-6 mb-4 transition-all border-gray-800 bg-zinc-800 ${
        !documento.ja_acessado ? 'shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'opacity-80'
      }`}
    >
      {/* Indicador de não acessado */}
      {!documento.ja_acessado && (
        <div className="absolute top-0 right-0 p-2">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
      )}

      <div className="flex gap-4 items-start">
        <div className="mt-1 flex-shrink-0">
          <FileText className="text-brand-red" size={32} />
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white font-oswald uppercase break-words">
                {documento.titulo}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                <span>{formatarData(documento.created_at)}</span>
                <span>•</span>
                <span>Por: {documento.autor.nome_guerra}</span>
                <span>•</span>
                <span className="uppercase border border-gray-700 px-2 py-0.5 rounded text-xs">
                  {getDestinatarioLabel()}
                </span>
                {documento.tipo_arquivo && (
                  <>
                    <span>•</span>
                    <span className="uppercase">{documento.tipo_arquivo}</span>
                  </>
                )}
                {documento.tamanho_bytes && (
                  <>
                    <span>•</span>
                    <span>{formatarTamanho(documento.tamanho_bytes)}</span>
                  </>
                )}
              </div>
              {documento.descricao && (
                <p className="text-gray-300 text-sm mt-3">{documento.descricao}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
              {documento.ja_acessado ? (
                <div className="flex items-center gap-1 text-green-500 text-xs bg-green-900/20 px-2 py-1 rounded justify-center sm:justify-start">
                  <CheckCheck size={14} /> Acessado
                </div>
              ) : (
                <button
                  onClick={() => onMarcarComoAcessado(documento.id)}
                  className="flex items-center gap-2 text-white hover:text-white text-xs sm:text-sm font-semibold bg-brand-red/20 hover:bg-brand-red/30 border-2 border-brand-red/50 hover:border-brand-red px-3 sm:px-4 py-2 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-zinc-800 shadow-lg hover:shadow-brand-red/20 justify-center"
                >
                  <Eye size={16} /> <span className="whitespace-nowrap">Marcar como acessado</span>
                </button>
              )}
              {onVisualizar && (
                <button
                  onClick={handleVisualizar}
                  className="flex items-center gap-2 text-white hover:text-white text-xs sm:text-sm font-semibold bg-brand-red/20 hover:bg-brand-red/30 border-2 border-brand-red/50 hover:border-brand-red px-3 sm:px-4 py-2 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-zinc-800 shadow-lg hover:shadow-brand-red/20 justify-center"
                >
                  <Eye size={16} /> <span className="whitespace-nowrap">Visualizar</span>
                </button>
              )}
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 text-white hover:text-white text-xs sm:text-sm font-semibold bg-blue-600/20 hover:bg-blue-600/30 border-2 border-blue-600/50 hover:border-blue-600 px-3 sm:px-4 py-2 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-zinc-800 shadow-lg hover:shadow-blue-600/20 justify-center"
              >
                <Download size={16} /> <span className="whitespace-nowrap">Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

