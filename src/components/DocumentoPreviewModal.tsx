import { X, Download, FileText } from 'lucide-react';
import { DocumentoComAutor } from '../types/database.types';

interface DocumentoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documento: DocumentoComAutor | null;
  onMarcarComoAcessado?: (id: string) => void;
}

export default function DocumentoPreviewModal({
  isOpen,
  onClose,
  documento,
  onMarcarComoAcessado
}: DocumentoPreviewModalProps) {
  if (!isOpen || !documento) return null;

  const isPdf = documento.tipo_arquivo?.toLowerCase() === 'pdf' || 
                documento.arquivo_url.match(/\.pdf$/i);

  const handleDownload = () => {
    window.open(documento.arquivo_url, '_blank');
  };

  const handleClose = () => {
    // Marcar como acessado quando fechar o modal se ainda não foi acessado
    if (!documento.ja_acessado && onMarcarComoAcessado) {
      onMarcarComoAcessado(documento.id);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="w-6 h-6 text-brand-red flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-white text-xl font-bold font-oswald uppercase truncate">
                  {documento.titulo}
                </h2>
                {documento.descricao && (
                  <p className="text-gray-400 text-sm mt-1 truncate">
                    {documento.descricao}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-gray-900">
            {isPdf ? (
              <iframe
                src={`${documento.arquivo_url}#toolbar=1`}
                className="w-full h-[75vh] rounded-lg border border-gray-700"
                title={documento.titulo}
              />
            ) : (
              <div className="text-center text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 text-brand-red" />
                <p className="text-lg mb-2">Visualização não disponível para este tipo de arquivo</p>
                <p className="text-sm text-gray-500 mb-4">
                  Tipo: {documento.tipo_arquivo || 'Desconhecido'}
                </p>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold mx-auto"
                >
                  <Download className="w-5 h-5" />
                  Baixar arquivo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
