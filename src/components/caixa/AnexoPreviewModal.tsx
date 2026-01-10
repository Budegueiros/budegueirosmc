import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';

interface AnexoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  anexoUrl: string;
  fileName?: string;
}

export default function AnexoPreviewModal({ isOpen, onClose, anexoUrl, fileName }: AnexoPreviewModalProps) {
  if (!isOpen) return null;

  const isImage = anexoUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = anexoUrl.match(/\.pdf$/i);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = anexoUrl;
    link.download = fileName || 'comprovante';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {isPdf ? (
                <FileText className="w-6 h-6 text-red-500" />
              ) : (
                <ImageIcon className="w-6 h-6 text-blue-500" />
              )}
              <h2 className="text-white text-xl font-bold">
                {fileName || 'Visualizar Comprovante'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Baixar
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-gray-900">
            {isImage ? (
              <img
                src={anexoUrl}
                alt="Comprovante"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            ) : isPdf ? (
              <iframe
                src={anexoUrl}
                className="w-full h-[70vh] rounded-lg border border-gray-700"
                title="Comprovante PDF"
              />
            ) : (
              <div className="text-center text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Visualização não disponível para este tipo de arquivo</p>
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
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


