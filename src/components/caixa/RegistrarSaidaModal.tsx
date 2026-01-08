import { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { CategoriaFluxoCaixa, TipoFluxoCaixa, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from '../../types/database.types';

import { FluxoCaixaComMembro } from '../../types/database.types';

interface RegistrarLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  membroId: string;
  tipo: TipoFluxoCaixa; // 'entrada' ou 'saida'
  lancamentoEdit?: FluxoCaixaComMembro | null; // Para edição
}

export default function RegistrarLancamentoModal({
  isOpen,
  onClose,
  onSuccess,
  membroId,
  tipo,
  lancamentoEdit
}: RegistrarLancamentoModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const getDefaultCategoria = (): CategoriaFluxoCaixa => {
    return tipo === 'entrada' ? 'Mensalidade' : 'Outros';
  };

  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    categoria: tipo === 'entrada' ? 'Mensalidade' : 'Outros'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Carregar dados quando estiver editando ou resetar quando criar novo
  useEffect(() => {
    if (isOpen) {
      if (lancamentoEdit) {
        // Modo edição: carregar dados do lançamento
        setFormData({
          descricao: lancamentoEdit.descricao,
          valor: lancamentoEdit.valor.toString(),
          data: lancamentoEdit.data,
          categoria: lancamentoEdit.categoria
        });
        setSelectedFile(null);
        // Se houver anexo existente, mostrar preview
        if (lancamentoEdit.anexo_url) {
          setFilePreview(lancamentoEdit.anexo_url);
        } else {
          setFilePreview(null);
        }
      } else {
        // Modo criação: resetar formulário
        const defaultCat: CategoriaFluxoCaixa = tipo === 'entrada' ? 'Mensalidade' : 'Outros';
        setFormData({
          descricao: '',
          valor: '',
          data: new Date().toISOString().split('T')[0],
          categoria: defaultCat
        });
        setSelectedFile(null);
        setFilePreview(null);
      }
    }
  }, [isOpen, lancamentoEdit, tipo]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toastError('Por favor, selecione um arquivo PNG, JPG ou PDF');
      return;
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toastError('O arquivo deve ter no máximo 10MB');
      return;
    }

    setSelectedFile(file);

    // Criar preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao.trim()) {
      toastError('Por favor, preencha a descrição');
      return;
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toastError('Por favor, informe um valor válido');
      return;
    }

    setSaving(true);

    try {
      let anexoUrl: string | null = null;

      // Upload do comprovante se houver
      if (selectedFile) {
        setUploading(true);
        try {
          const fileName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          const { error: uploadError } = await supabase.storage
            .from('comprovantes')
            .upload(fileName, selectedFile);

          if (uploadError) throw uploadError;

          // Obter URL pública
          const { data: urlData } = supabase.storage
            .from('comprovantes')
            .getPublicUrl(fileName);

          anexoUrl = urlData.publicUrl;
        } catch (uploadErr: any) {
          console.error('Erro ao fazer upload:', uploadErr);
          toastError('Erro ao fazer upload do comprovante. Tente novamente.');
          setUploading(false);
          setSaving(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      // Criar ou atualizar lançamento no banco
      if (lancamentoEdit) {
        // Modo edição
        const updateData: any = {
          descricao: formData.descricao.trim(),
          categoria: formData.categoria,
          valor: parseFloat(formData.valor),
          data: formData.data,
        };

        // Se houver novo arquivo, atualizar anexo_url, senão manter o existente
        if (anexoUrl !== null) {
          updateData.anexo_url = anexoUrl;
        }

        const { error: updateError } = await supabase
          .from('fluxo_caixa')
          .update(updateData)
          .eq('id', lancamentoEdit.id);

        if (updateError) throw updateError;
        toastSuccess('Lançamento atualizado com sucesso!');
      } else {
        // Modo criação
        const { error: insertError } = await supabase
          .from('fluxo_caixa')
          .insert({
            tipo: tipo,
            descricao: formData.descricao.trim(),
            categoria: formData.categoria,
            valor: parseFloat(formData.valor),
            data: formData.data,
            anexo_url: anexoUrl,
            membro_id: membroId
          });

        if (insertError) throw insertError;
        toastSuccess(tipo === 'entrada' ? 'Entrada registrada com sucesso!' : 'Saída registrada com sucesso!');
      }
      
      // Limpar formulário
      setFormData({
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        categoria: getDefaultCategoria()
      });
      setSelectedFile(null);
      setFilePreview(null);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao registrar saída:', error);
      toastError('Erro ao registrar saída. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving || uploading) return;
    setFormData({
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      categoria: tipo === 'entrada' ? 'Mensalidade' : 'Outros'
    });
    setSelectedFile(null);
    setFilePreview(null);
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
          className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-white text-xl font-bold">
              {lancamentoEdit 
                ? 'Editar Lançamento' 
                : tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
            </h2>
            <button
              onClick={handleClose}
              disabled={saving || uploading}
              className="text-gray-400 hover:text-white transition disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Descrição */}
              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  placeholder={(lancamentoEdit ? lancamentoEdit.tipo : tipo) === 'entrada' ? 'Ex: Doação, Venda de camisetas, etc.' : 'Ex: Compra de combustível para evento'}
                  disabled={saving || uploading}
                  required
                />
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    placeholder="0.00"
                    disabled={saving || uploading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    disabled={saving || uploading}
                    required
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value as CategoriaFluxoCaixa })}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  disabled={saving || uploading}
                  required
                >
                  {(lancamentoEdit ? lancamentoEdit.tipo : tipo) === 'entrada' ? (
                    <>
                      <option value="Mensalidade">Mensalidade</option>
                      <option value="Doação">Doação</option>
                      <option value="Venda">Venda</option>
                      <option value="Evento">Evento</option>
                      <option value="Outros">Outros</option>
                    </>
                  ) : (
                    <>
                      <option value="Combustível">Combustível</option>
                      <option value="Sede">Sede</option>
                      <option value="Eventos">Eventos</option>
                      <option value="Outros">Outros</option>
                    </>
                  )}
                </select>
              </div>

              {/* Upload de Comprovante - Apenas para saídas ou se estiver editando uma saída */}
              {(tipo === 'saida' || (lancamentoEdit && lancamentoEdit.tipo === 'saida')) && (
                <div>
                  <label className="block text-gray-400 text-xs uppercase mb-1">
                    Comprovante (Opcional)
                  </label>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-800/50 transition">
                      {filePreview ? (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <img src={filePreview} alt="Preview" className="max-h-20 max-w-full mb-2" />
                          <p className="text-xs text-gray-400">{selectedFile?.name}</p>
                        </div>
                      ) : selectedFile ? (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">PDF selecionado</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">
                            <span className="font-semibold">Clique para upload</span> ou arraste o arquivo
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG ou PDF (máx. 10MB)</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={handleFileChange}
                        disabled={saving || uploading}
                      />
                    </label>
                  </div>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="mt-2 text-xs text-red-400 hover:text-red-300 transition"
                      disabled={saving || uploading}
                    >
                      Remover arquivo
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving || uploading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50 flex items-center gap-2"
              >
                {(saving || uploading) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploading ? 'Enviando...' : 'Salvando...'}
                  </>
                ) : (
                  lancamentoEdit 
                    ? 'Salvar Alterações' 
                    : tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

