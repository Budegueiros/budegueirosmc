// ============================================================================
// Componente EditMemberModal
// ============================================================================
// Descrição: Modal de edição de membros com seções agrupadas
// Data: 2025-01-XX
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { X, Save, Camera, Upload, Loader2 } from 'lucide-react';
import { Membro, StatusMembroEnum } from '../../types/database.types';
import { useManageMembers, UpdateMemberData } from '../../hooks/useManageMembers';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { compressImage, isValidImageFile } from '../../utils/imageCompression';

interface MembroWithCargos extends Membro {
  cargos_ativos?: Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
  }>;
}

interface EditMemberModalProps {
  membro: MembroWithCargos | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  nome_completo: string;
  nome_guerra: string;
  status_membro: StatusMembroEnum;
  numero_carteira: string;
  data_inicio: string;
  telefone: string;
  endereco_cidade: string;
  endereco_estado: string;
  padrinho_id: string | null;
}

interface FormErrors {
  nome_completo?: string;
  nome_guerra?: string;
  telefone?: string;
}

/**
 * Componente de modal para edição de membros
 * 
 * @param membro - Dados do membro a ser editado
 * @param isOpen - Controla se o modal está aberto
 * @param onClose - Callback quando o modal é fechado
 * @param onSuccess - Callback quando a edição é bem-sucedida
 * 
 * @example
 * ```tsx
 * <EditMemberModal 
 *   membro={selectedMember} 
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSuccess={handleRefresh}
 * />
 * ```
 */
export default function EditMemberModal({
  membro,
  isOpen,
  onClose,
  onSuccess,
}: EditMemberModalProps) {
  const { user } = useAuth();
  const { updateMember, loading } = useManageMembers();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [formData, setFormData] = useState<FormData>({
    nome_completo: '',
    nome_guerra: '',
    status_membro: 'Aspirante',
    numero_carteira: '',
    data_inicio: '',
    telefone: '',
    endereco_cidade: '',
    endereco_estado: '',
    padrinho_id: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [padrinhosDisponiveis, setPadrinhosDisponiveis] = useState<Array<{
    id: string;
    nome_guerra: string;
    nome_completo: string;
  }>>([]);
  const [cargosSelecionados, setCargosSelecionados] = useState<string[]>([]);
  const [cargosOriginais, setCargosOriginais] = useState<string[]>([]);
  const [todosOsCargos, setTodosOsCargos] = useState<Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
    nivel: number;
  }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados do membro quando o modal abrir
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
        padrinho_id: membro.padrinho_id,
      });
      setPreviewUrl(membro.foto_url);
      setErrors({});
      carregarPadrinhos();
      carregarCargos();
    }
  }, [membro, isOpen]);

  const carregarPadrinhos = async () => {
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome_guerra, nome_completo')
        .eq('ativo', true)
        .order('nome_guerra', { ascending: true });

      if (error) throw error;
      setPadrinhosDisponiveis(data || []);
    } catch (error) {
      console.error('Erro ao carregar padrinhos:', error);
    }
  };

  const carregarCargos = async () => {
    if (!membro) return;

    try {
      // Carregar cargos atuais do membro
      const { data: membroCargosData, error: membroCargosError } = await supabase
        .from('membro_cargos')
        .select('cargo_id')
        .eq('membro_id', membro.id)
        .eq('ativo', true);

      if (membroCargosError) throw membroCargosError;

      const cargosAtuaisIds = (membroCargosData || []).map((mc: any) => mc.cargo_id);
      setCargosSelecionados(cargosAtuaisIds);
      setCargosOriginais(cargosAtuaisIds);

      // Carregar todos os cargos disponíveis
      const { data: cargosData, error: cargosError } = await supabase
        .from('cargos')
        .select('id, nome, tipo_cargo, nivel')
        .eq('ativo', true)
        .order('nivel', { ascending: true });

      if (cargosError) throw cargosError;
      setTodosOsCargos(cargosData || []);
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
    }
  };

  // Validações
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Nome completo: obrigatório, min 3 caracteres
    if (!formData.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    } else if (formData.nome_completo.trim().length < 3) {
      newErrors.nome_completo = 'Nome completo deve ter pelo menos 3 caracteres';
    }

    // Nome de guerra: obrigatório
    if (!formData.nome_guerra.trim()) {
      newErrors.nome_guerra = 'Nome de guerra é obrigatório';
    }

    // Telefone: formato brasileiro opcional (se preenchido, deve ser válido)
    if (formData.telefone.trim()) {
      const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}[-.\s]?\d{4})$/;
      if (!phoneRegex.test(formData.telefone.replace(/\s/g, ''))) {
        newErrors.telefone = 'Formato de telefone inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file)) {
      toastWarning('Selecione uma imagem válida (jpg, jpeg, png, webp)');
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImage(file, 2);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (error) {
      toastError('Erro ao processar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!membro || !validateForm()) {
      return;
    }

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
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, compressed, { upsert: true });
          
          if (uploadError) throw uploadError;
          
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          fotoUrl = publicUrlData?.publicUrl || null;
        }
        setUploading(false);
      }

      // Preparar dados para update
      const updateData: UpdateMemberData = {
        nome_completo: formData.nome_completo.trim(),
        nome_guerra: formData.nome_guerra.trim(),
        status_membro: formData.status_membro,
        numero_carteira: formData.numero_carteira.trim(),
        data_inicio: formData.data_inicio || null,
        telefone: formData.telefone.trim() || null,
        endereco_cidade: formData.endereco_cidade.trim() || null,
        endereco_estado: formData.endereco_estado || null,
        foto_url: fotoUrl,
        padrinho_id: formData.padrinho_id,
      };

      await updateMember(membro.id, updateData);
      
      // Salvar cargos
      await handleSaveCargos();
      
      toastSuccess('Membro atualizado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      toastError('Erro ao atualizar membro. Tente novamente.');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleSaveCargos = async () => {
    if (!membro) return;

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

  const handleToggleCargo = (cargoId: string) => {
    setCargosSelecionados((prev) => {
      if (prev.includes(cargoId)) {
        return prev.filter(id => id !== cargoId);
      } else {
        return [...prev, cargoId];
      }
    });
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
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Seção: Pessoal */}
              <div className="space-y-4">
                <h3 className="text-white font-oswald text-lg uppercase font-bold border-b border-[#D32F2F]/30 pb-2">
                  Informações Pessoais
                </h3>

                {/* Upload de Foto */}
                <div>
                  <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                    Foto do Membro
                  </label>
                  <div className="flex items-center gap-4">
                    <div>
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-[#D32F2F]/30"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#121212] flex items-center justify-center border-2 border-[#D32F2F]/30 text-[#B0B0B0]">
                          <Camera className="w-8 h-8" />
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
                      <label
                        htmlFor="foto-upload"
                        className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-4 py-2 rounded cursor-pointer text-sm font-oswald uppercase transition disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Enviando...' : 'Selecionar Foto'}
                      </label>
                      {previewUrl && (
                        <button
                          type="button"
                          className="ml-2 text-sm text-[#B0B0B0] hover:text-[#D32F2F] underline"
                          onClick={() => {
                            setPreviewUrl(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          disabled={saving || uploading}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome_completo}
                      onChange={(e) =>
                        setFormData({ ...formData, nome_completo: e.target.value })
                      }
                      className={`w-full bg-[#121212] border ${
                        errors.nome_completo
                          ? 'border-red-500'
                          : 'border-[#D32F2F]/30'
                      } rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]`}
                      disabled={saving}
                    />
                    {errors.nome_completo && (
                      <p className="text-red-500 text-xs mt-1">{errors.nome_completo}</p>
                    )}
                  </div>

                  {/* Nome de Guerra */}
                  <div>
                    <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                      Nome de Guerra *
                    </label>
                    <input
                      type="text"
                      value={formData.nome_guerra}
                      onChange={(e) =>
                        setFormData({ ...formData, nome_guerra: e.target.value.toUpperCase() })
                      }
                      className={`w-full bg-[#121212] border ${
                        errors.nome_guerra
                          ? 'border-red-500'
                          : 'border-[#D32F2F]/30'
                      } rounded px-3 py-2 text-white text-sm uppercase focus:outline-none focus:border-[#D32F2F]`}
                      disabled={saving}
                    />
                    {errors.nome_guerra && (
                      <p className="text-red-500 text-xs mt-1">{errors.nome_guerra}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status_membro}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status_membro: e.target.value as StatusMembroEnum,
                        })
                      }
                      className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                      disabled={saving}
                    >
                      <option value="Aspirante">Aspirante</option>
                      <option value="Prospect">Prospect</option>
                      <option value="Brasionado">Brasionado</option>
                      <option value="Nomade">Nômade</option>
                    </select>
                  </div>

                  {/* Número da Carteira */}
                  <div>
                    <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                      Número da Carteira *
                    </label>
                    <input
                      type="text"
                      value={formData.numero_carteira}
                      onChange={(e) =>
                        setFormData({ ...formData, numero_carteira: e.target.value })
                      }
                      className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                      disabled={saving}
                    />
                  </div>

                  {/* Data de Início */}
                  <div>
                    <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) =>
                        setFormData({ ...formData, data_inicio: e.target.value })
                      }
                      className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                      disabled={saving}
                    />
                  </div>

                  {/* Padrinho */}
                  <div>
                    <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                      Padrinho
                    </label>
                    <select
                      value={formData.padrinho_id || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          padrinho_id: e.target.value || null,
                        })
                      }
                      className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                      disabled={saving}
                    >
                      <option value="">Nenhum</option>
                      {padrinhosDisponiveis
                        .filter((p) => p.id !== membro.id)
                        .map((padrinho) => (
                          <option key={padrinho.id} value={padrinho.id}>
                            {padrinho.nome_guerra} - {padrinho.nome_completo}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção: Contato */}
              <div className="space-y-4">
                <h3 className="text-white font-oswald text-lg uppercase font-bold border-b border-[#D32F2F]/30 pb-2">
                  Contato
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email (Readonly) */}
                  <div>
                    <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                      Email (não editável)
                    </label>
                    <input
                      type="email"
                      value={membro.email}
                      disabled
                      className="w-full bg-[#121212]/50 border border-[#D32F2F]/20 rounded px-3 py-2 text-[#B0B0B0] text-sm cursor-not-allowed"
                    />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) =>
                        setFormData({ ...formData, telefone: e.target.value })
                      }
                      placeholder="(00) 00000-0000"
                      className={`w-full bg-[#121212] border ${
                        errors.telefone ? 'border-red-500' : 'border-[#D32F2F]/30'
                      } rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]`}
                      disabled={saving}
                    />
                    {errors.telefone && (
                      <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção: Cargos */}
              <div className="space-y-4">
                <h3 className="text-white font-oswald text-lg uppercase font-bold border-b border-[#D32F2F]/30 pb-2">
                  Cargos
                </h3>

                <div className="space-y-2">
                  {todosOsCargos.length === 0 ? (
                    <p className="text-[#B0B0B0] text-sm">Nenhum cargo disponível</p>
                  ) : (
                    todosOsCargos.map((cargo) => (
                      <label
                        key={cargo.id}
                        className="flex items-center gap-3 p-3 bg-[#121212] border border-[#D32F2F]/30 rounded-lg hover:border-[#D32F2F]/50 transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={cargosSelecionados.includes(cargo.id)}
                          onChange={() => handleToggleCargo(cargo.id)}
                          disabled={saving}
                          className="w-5 h-5 rounded border-[#D32F2F]/30 bg-[#121212] text-[#D32F2F] focus:ring-[#D32F2F] focus:ring-offset-0 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="text-white font-oswald text-sm uppercase font-bold">
                            {cargo.nome}
                          </p>
                          <p className="text-[#B0B0B0] text-xs">
                            {cargo.tipo_cargo} • Nível {cargo.nivel}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Seção: Localização */}
              <div className="space-y-4">
                <h3 className="text-white font-oswald text-lg uppercase font-bold border-b border-[#D32F2F]/30 pb-2">
                  Localização
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cidade */}
                  <div>
                    <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.endereco_cidade}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco_cidade: e.target.value })
                      }
                      className="w-full bg-[#121212] border border-[#D32F2F]/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D32F2F]"
                      disabled={saving}
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-[#B0B0B0] text-xs uppercase mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.endereco_estado}
                      onChange={(e) =>
                        setFormData({ ...formData, endereco_estado: e.target.value })
                      }
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
                </div>
              </div>
            </div>
          </div>

          {/* Footer Fixo */}
          <div className="sticky bottom-0 bg-[#1E1E1E] border-t border-[#D32F2F]/30 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-[#121212] hover:bg-[#1E1E1E] border border-[#D32F2F]/30 text-[#B0B0B0] hover:text-white rounded transition font-oswald uppercase text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploading || loading}
              className="px-6 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded transition font-oswald uppercase text-sm font-bold disabled:opacity-50 flex items-center gap-2"
            >
              {saving || loading ? (
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

