import { X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface ShareEventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareText: string;
  shareTitle?: string;
  shareUrl?: string;
  shareImageUrl?: string | null;
}

export default function ShareEventoModal({
  isOpen,
  onClose,
  shareText,
  shareTitle = 'Evento Budegueiros',
  shareUrl = '',
  shareImageUrl = null,
}: ShareEventoModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  if (!isOpen) return null;

  const fullText = shareUrl ? `${shareText} ${shareUrl}` : shareText;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;

  const shareWithImage = async () => {
    if (!shareImageUrl || !navigator.share) return false;
    try {
      const response = await fetch(shareImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'evento.jpg', { type: blob.type || 'image/jpeg' });

      if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
        return false;
      }

      await navigator.share({
        title: shareTitle,
        text: fullText,
        files: [file],
      });
      return true;
    } catch (error) {
      console.error('Erro ao compartilhar com imagem:', error);
      return false;
    }
  };

  const handleShareSystem = async () => {
    if (!navigator.share) return false;
    try {
      await navigator.share({
        title: shareTitle,
        text: fullText,
      });
      return true;
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      return false;
    }
  };

  const handleShareInstagram = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullText);
        toastSuccess('Texto copiado! Cole no Instagram.');
      } else {
        toastError('Não foi possível copiar o texto.');
      }
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      toastError('Erro ao copiar texto.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white text-xl font-bold">Compartilhar Evento</h3>
            <p className="text-gray-400 text-sm">Escolha onde compartilhar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={async () => {
              const shared = await shareWithImage();
              if (shared) return;
              window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            }}
            className="w-full px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold transition"
          >
            WhatsApp
          </button>
          <button
            onClick={handleShareInstagram}
            className="w-full px-4 py-2 rounded bg-pink-600 hover:bg-pink-700 text-white font-semibold transition"
          >
            Instagram
          </button>
          {navigator.share && (
            <button
              onClick={async () => {
                const shared = await shareWithImage();
                if (!shared) {
                  await handleShareSystem();
                }
              }}
              className="w-full px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-semibold transition"
            >
              Compartilhar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
