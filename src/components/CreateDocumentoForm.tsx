import { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { DocumentoTipoDestinatario } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';

interface CreateDocumentoFormProps {
  membroId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateDocumentoForm({ membroId, onSuccess, onCancel }: CreateDocumentoFormProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoDestinatario, setTipoDestinatario] = useState<DocumentoTipoDestinatario>('geral');
  const [valorDestinatario, setValorDestinatario] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho máximo (50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toastError('Arquivo muito grande. Tamanho máximo: 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user) {
      toastError('Por favor, selecione um arquivo.');
      return;
    }

    setLoading(true);

    try {
      // Upload do arquivo
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

      // Inserir documento no banco
      const { error } = await supabase.from('documentos').insert({
        titulo,
        descricao: descricao || null,
        arquivo_url: urlData.publicUrl,
        nome_arquivo: selectedFile.name,
        tipo_arquivo: fileExt || null,
        tamanho_bytes: selectedFile.size,
        tipo_destinatario: tipoDestinatario,
        valor_destinatario: tipoDestinatario === 'geral' ? null : valorDestinatario,
        membro_id_autor: membroId
      });

      if (error) throw error;

      toastSuccess('Documento adicionado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar documento:', error);
      toastError('Erro ao adicionar documento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-800 p-6 rounded-lg border border-gray-700 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white font-oswald uppercase">Novo Documento</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition"
          type="button"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Título */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Título do Documento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red"
            placeholder="Ex: Estatuto do Clube 2024"
            required
          />
        </div>

        {/* Descrição */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descrição (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red min-h-[100px]"
            placeholder="Adicione uma descrição sobre o documento..."
            rows={3}
          />
        </div>

        {/* Upload de Arquivo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Arquivo <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-brand-red transition">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="text-brand-red w-12 h-12" />
                <div>
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-400 text-sm"
                >
                  Remover arquivo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="text-gray-400 w-12 h-12" />
                <div>
                  <p className="text-gray-400">
                    Clique para selecionar ou arraste o arquivo aqui
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG (máx. 50MB)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition"
                >
                  Selecionar Arquivo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Destinatário */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Compartilhar com <span className="text-red-500">*</span>
          </label>
          <select
            value={tipoDestinatario}
            onChange={(e) => setTipoDestinatario(e.target.value as DocumentoTipoDestinatario)}
            className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red"
          >
            <option value="geral">Geral (Todos os Integrantes)</option>
            <option value="cargo">Por Cargo/Função</option>
            <option value="integrante">Integrante Específico (Privado)</option>
          </select>
        </div>

        {/* Campo condicional para cargo */}
        {tipoDestinatario === 'cargo' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Selecione o Cargo <span className="text-red-500">*</span>
            </label>
            <select
              value={valorDestinatario}
              onChange={(e) => setValorDestinatario(e.target.value)}
              className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red"
              required
            >
              <option value="">Selecione...</option>
              <option value="Presidente">Presidente</option>
              <option value="Vice-Presidente">Vice-Presidente</option>
              <option value="Road Captain">Road Captain</option>
              <option value="Tesoureiro">Tesoureiro</option>
              <option value="Secretário">Secretário</option>
              <option value="Sargento de Armas">Sargento de Armas</option>
            </select>
          </div>
        )}

        {/* Campo condicional para integrante específico */}
        {tipoDestinatario === 'integrante' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome de Guerra do Integrante <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={valorDestinatario}
              onChange={(e) => setValorDestinatario(e.target.value)}
              className="w-full bg-zinc-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red"
              placeholder="Digite o Nome de Guerra"
              required
            />
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded text-gray-400 hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="px-6 py-2 bg-brand-red hover:bg-red-700 text-white font-bold rounded shadow-lg transition disabled:opacity-50 font-oswald uppercase"
          >
            {loading ? 'Enviando...' : 'Adicionar Documento'}
          </button>
        </div>
      </form>
    </div>
  );
}

