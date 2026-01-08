import { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, Camera, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { compressImage, isValidImageFile } from '../../utils/imageCompression';
import { Membro, StatusMembroEnum } from '../../types/database.types';

interface EditMemberGeneralModalProps {
  membro: Membro | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  padrinhosDisponiveis: Array<{ id: string; nome_guerra: string; nome_completo: string }>;
  todosOsCargos: Array<{ id: string; nome: string; tipo_cargo: string; nivel: number }>;
  cargosSelecionados: string[];
  onCargosChange: (cargos: string[]) => void;
}

export default function EditMemberGeneralModal({
  membro,
  isOpen,
  onClose,
  onSuccess,
  padrinhosDisponiveis,
  todosOsCargos,
  cargosSelecionados,
  onCargosChange
}: EditMemberGeneralModalProps) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [formData, setFormData] = useState({
    nome_completo: '',
    nome_guerra: '',
    status_membro: 'Aspirante' as StatusMembroEnum,
    numero_carteira: '',
    data_inicio: '',
    telefone: '',
    endereco_cidade: '',
    endereco_estado: '',
    padrinho_id: ''
  });

  useEffect(() => {
    if (membro && isOpen) {
      setFormData({
        nome_completo: membro.nome_completo,
        nome_guerra: membro.nome_guerra,
        status_membro: membro.status_membro,
        numero_carteira: membro.numero_carteira,
        data_inicio: membro.data_inicio || '',
        telefone: membro.telefone || '',
        endereco_cidade: membro.endereco_cidade || '',
        endereco_estado: membro.endereco_estado || '',
        padrinho_id: membro.padrinho_id || ''
      });
      setPreviewUrl(membro.foto_url || null);
    }
  }, [membro, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file)) {
      toastWarning('Selecione uma imagem válida (jpg, jpeg, png, webp)');
      return;
    }
    setUploading(true);
    const compressed = await compressImage(file, 2);
    setPreviewUrl(URL.createObjectURL(compressed));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!membro) return;
    
    setSaving(true);
    try {
      let fotoUrl = membro.foto_url;
      
      // Upload de foto se necessário
      if (previewUrl && previewUrl !== membro.foto_url && previewUrl.startsWith('blob:')) {
        setUploading(true);
        const file = fileInputRef.current?.files?.[0];
        if (file && user) {
          const compressed = await compressImage(file, 2);
          const ext = file.name.split('.').pop();
          const filePath = `${user.id}/membros/${membro.id}_${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, compressed, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          fotoUrl = publicUrlData?.publicUrl || null;
        }
        setUploading(false);
      }

      // Atualizar membro
      const { error } = await supabase
        .from('membros')
        .update({
          nome_completo: formData.nome_completo,
          nome_guerra: formData.nome_guerra.toUpperCase(),
          status_membro: formData.status_membro,
          numero_carteira: formData.numero_carteira,
          data_inicio: formData.data_inicio || null,
          telefone: formData.telefone || null,
          endereco_cidade: formData.endereco_cidade || null,
          endereco_estado: formData.endereco_estado || null,
          foto_url: fotoUrl,
          padrinho_id: formData.padrinho_id || null,
        })
        .eq('id', membro.id);

      if (error) throw error;

      // Salvar cargos
      await handleSaveCargos();

      toastSuccess('Dados do membro atualizados com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar membro:', error);
      toastError('Erro ao atualizar dados do membro');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleToggleCargo = (cargoId: string) => {
    if (cargosSelecionados.includes(cargoId)) {
      onCargosChange(cargosSelecionados.filter(id => id !== cargoId));
    } else {
      onCargosChange([...cargosSelecionados, cargoId]);
    }
  };

  const handleSaveCargos = async () => {
    if (!membro) return;
    
    // Buscar cargos atuais do membro
    const { data: membroCargosData } = await supabase
      .from('membro_cargos')
      .select('cargo_id, ativo')
      .eq('membro_id', membro.id)
      .eq('ativo', true);
    
    const cargosOriginais = membroCargosData?.map(mc => mc.cargo_id) || [];
    const cargosParaAdicionar = cargosSelecionados.filter(id => !cargosOriginais.includes(id));
    const cargosParaRemover = cargosOriginais.filter(id => !cargosSelecionados.includes(id));
    
    // Adicionar novos cargos
    for (const cargoId of cargosParaAdicionar) {
      const { error } = await supabase
        .from('membro_cargos')
        .insert({
          membro_id: membro.id,
          cargo_id: cargoId,
          ativo: true
        });
      
      if (error) throw error;
    }
    
    // Remover cargos
    for (const cargoId of cargosParaRemover) {
      const { error } = await supabase
        .from('membro_cargos')
        .update({ ativo: false })
        .eq('membro_id', membro.id)
        .eq('cargo_id', cargoId);
      
      if (error) throw error;
    }
  };

  if (!isOpen || !membro) return null;

  return (
    <>
      {/* Backdrop com blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="bg-[#1E1E1E] border border-[#D32F2F]/30 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Fixo */}
          <div className="sticky top-0 bg-[#1E1E1E] border-b border-[#D32F2F]/30 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-white font-oswald text-xl uppercase font-bold">
                Editar Membro
              </h2>
              <p className="text-[#B0B0B0] text-sm mt-1">{membro.nome_guerra}</p>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="text-[#B0B0B0] hover:text-white transition disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload de Foto */}
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs uppercase mb-1">Foto do Membro (opcional)</label>
                <div className="flex items-center gap-4">
                  <div>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-[#D32F2F]/30" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700 text-gray-500">
                        <Camera className="w-7 h-7" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      disabled={saving || uploading}
                      className="hidden"
                      id="foto-upload"
                    />
                    <label htmlFor="foto-upload" className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-red-700 text-white px-3 py-2 rounded cursor-pointer text-xs font-bold transition disabled:opacity-50">
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Enviando...' : 'Selecionar Foto'}
                    </label>
                    {previewUrl && (
                      <button
                        type="button"
                        className="ml-2 text-xs text-gray-400 hover:text-red-500 underline"
                        onClick={() => { setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        disabled={saving || uploading}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Nome de Guerra</label>
                <input
                  type="text"
                  value={formData.nome_guerra}
                  onChange={(e) => setFormData({ ...formData, nome_guerra: e.target.value })}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F] uppercase"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
                <select
                  value={formData.status_membro}
                  onChange={(e) => setFormData({ ...formData, status_membro: e.target.value as StatusMembroEnum })}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                  disabled={saving}
                >
                  <option value="Aspirante">Aspirante</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Brasionado">Brasionado</option>
                  <option value="Nomade">Nômade</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Número da Carteira</label>
                <input
                  type="text"
                  value={formData.numero_carteira}
                  onChange={(e) => setFormData({ ...formData, numero_carteira: e.target.value })}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Data de Início</label>
                <input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Cidade</label>
                <input
                  type="text"
                  value={formData.endereco_cidade}
                  onChange={(e) => setFormData({ ...formData, endereco_cidade: e.target.value })}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Estado</label>
                <select
                  value={formData.endereco_estado}
                  onChange={(e) => setFormData({ ...formData, endereco_estado: e.target.value })}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                  disabled={saving}
                >
                  <option value="">Selecione</option>
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="PR">Paraná</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="RS">Rio Grande do Sul</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-xs uppercase mb-1">Padrinho</label>
                <select
                  value={formData.padrinho_id}
                  onChange={(e) => setFormData({ ...formData, padrinho_id: e.target.value })}
                  className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                  disabled={saving}
                >
                  <option value="">Nenhum</option>
                  {padrinhosDisponiveis
                    .filter(p => p.id !== membro.id)
                    .map((padrinho) => (
                      <option key={padrinho.id} value={padrinho.id}>
                        {padrinho.nome_guerra} - {padrinho.nome_completo}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Informação do Email (não editável) */}
            <div className="pt-3 border-t border-gray-700 mt-4">
              <p className="text-gray-500 text-xs">
                📧 Email: <span className="text-gray-400">{membro.email}</span> (não editável)
              </p>
            </div>

            {/* Seção de Cargos */}
            <div className="pt-4 border-t border-gray-700 mt-4">
              <h4 className="text-white font-oswald text-sm uppercase font-bold mb-3">Cargos</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {todosOsCargos.map((cargo) => {
                  const isSelected = cargosSelecionados.includes(cargo.id);
                  return (
                    <button
                      key={cargo.id}
                      type="button"
                      onClick={() => handleToggleCargo(cargo.id)}
                      disabled={saving}
                      className={`px-3 py-2 rounded text-xs transition ${
                        isSelected
                          ? 'bg-[#D32F2F] text-white border border-[#D32F2F]'
                          : 'bg-[#121212] text-gray-400 border border-gray-700 hover:border-[#D32F2F]/50'
                      } disabled:opacity-50`}
                    >
                      <div className="font-semibold">{cargo.nome}</div>
                      <div className="text-xs opacity-75">{cargo.tipo_cargo}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Fixo */}
          <div className="sticky bottom-0 bg-[#1E1E1E] border-t border-[#D32F2F]/30 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="px-4 py-2 bg-[#D32F2F] hover:bg-red-700 text-white rounded transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

