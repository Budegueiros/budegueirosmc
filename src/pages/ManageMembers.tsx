import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Search, Edit2, Shield, ShieldOff, UserPlus, ArrowLeft, X, Loader2, Save, Upload, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compressImage, isValidImageFile } from '../utils/imageCompression';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { Membro, StatusMembroEnum, STATUS_STYLES } from '../types/database.types';

interface EditingMembro {
  nome_completo: string;
  nome_guerra: string;
  status_membro: StatusMembroEnum;
  numero_carteira: string;
  data_inicio: string;
  telefone: string;
  endereco_cidade: string;
  endereco_estado: string;
  foto_url: string | null;
  padrinho_id: string | null;
}

interface MembroWithCargos extends Membro {
  cargos_ativos?: Array<{
    id: string;
    nome: string;
    tipo_cargo: string;
  }>;
}

export default function ManageMembers() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { error: toastError, warning: toastWarning } = useToast();
  const navigate = useNavigate();
  
  const [membros, setMembros] = useState<MembroWithCargos[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingMembro | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Estados para gerenciamento de cargos
    // Upload de foto
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [todosOsCargos, setTodosOsCargos] = useState<Array<{ id: string; nome: string; tipo_cargo: string; nivel: number }>>([]);
  const [cargosSelecionados, setCargosSelecionados] = useState<string[]>([]);
  const [cargosOriginais, setCargosOriginais] = useState<string[]>([]);
  const [padrinhosDisponiveis, setPadrinhosDisponiveis] = useState<Array<{ id: string; nome_guerra: string; nome_completo: string }>>([]);

  useEffect(() => {
    // Redirecionar se não for admin
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      carregarDados();
    }
  }, [isAdmin]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar todos os membros com seus cargos ativos (LEFT JOIN para incluir membros sem cargos)
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select(`
          *,
          membro_cargos (
            id,
            ativo,
            cargos (
              id,
              nome,
              tipo_cargo
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (membrosError) throw membrosError;
      
      // Transformar dados para incluir apenas cargos ativos
      const membrosTransformados = (membrosData || []).map((m: any) => ({
        ...m,
        cargos_ativos: m.membro_cargos
          ?.filter((mc: any) => mc.cargos && mc.ativo)
          .map((mc: any) => mc.cargos) || []
      }));
      
      setMembros(membrosTransformados);
      
      // Carregar todos os cargos disponíveis
      const { data: cargosData, error: cargosError } = await supabase
        .from('cargos')
        .select('id, nome, tipo_cargo, nivel')
        .eq('ativo', true)
        .order('nivel', { ascending: true });
      
      if (cargosError) throw cargosError;
      setTodosOsCargos(cargosData || []);
      
      // Carregar membros disponíveis para serem padrinhos
      const { data: padrinhosData, error: padrinhosError } = await supabase
        .from('membros')
        .select('id, nome_guerra, nome_completo')
        .eq('ativo', true)
        .order('nome_guerra', { ascending: true });
      
      if (padrinhosError) throw padrinhosError;
      setPadrinhosDisponiveis(padrinhosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMembro = (membro: MembroWithCargos) => {
    setEditingId(membro.id);
    setEditingData({
      nome_completo: membro.nome_completo,
      nome_guerra: membro.nome_guerra,
      status_membro: membro.status_membro,
      numero_carteira: membro.numero_carteira,
      data_inicio: membro.data_inicio || '',
      telefone: membro.telefone || '',
      endereco_cidade: membro.endereco_cidade || '',
      endereco_estado: membro.endereco_estado || '',
      foto_url: membro.foto_url || null,
      padrinho_id: membro.padrinho_id || null,
    });
    setPreviewUrl(membro.foto_url || null);
    // Carregar cargos atuais do membro
    const cargosAtuaisIds = membro.cargos_ativos?.map(c => c.id) || [];
    setCargosSelecionados(cargosAtuaisIds);
    setCargosOriginais(cargosAtuaisIds);
  };

  const handleSaveCargos = async (membroId: string) => {
    // Identificar cargos a adicionar e remover
    const cargosParaAdicionar = cargosSelecionados.filter(id => !cargosOriginais.includes(id));
    const cargosParaRemover = cargosOriginais.filter(id => !cargosSelecionados.includes(id));
    
    // Adicionar novos cargos
    for (const cargoId of cargosParaAdicionar) {
      const { error } = await supabase
        .from('membro_cargos')
        .insert({
          membro_id: membroId,
          cargo_id: cargoId,
          ativo: true
        });
      
      if (error) throw error;
    }
    
    // Remover cargos (desativar)
    for (const cargoId of cargosParaRemover) {
      const { error } = await supabase
        .from('membro_cargos')
        .update({ ativo: false })
        .eq('membro_id', membroId)
        .eq('cargo_id', cargoId);
      
      if (error) throw error;
    }
  };

  const handleSaveMembro = async (membroId: string) => {
    if (!editingData) return;
    setSaving(true);
    try {
      let fotoUrl = editingData.foto_url;
      // Se previewUrl mudou e não é igual ao original, fazer upload
      if (previewUrl && previewUrl !== editingData.foto_url && previewUrl.startsWith('blob:')) {
        setUploading(true);
        // Buscar arquivo do input
        const file = fileInputRef.current?.files?.[0];
        if (file && user) {
          // Comprimir imagem
          const compressed = await compressImage(file, 2);
          const ext = file.name.split('.').pop();
          // Usar estrutura de pastas permitida pelas políticas RLS
          const filePath = `${user.id}/membros/${membroId}_${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, compressed, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          fotoUrl = publicUrlData?.publicUrl || null;
        }
        setUploading(false);
      }
      const { error } = await supabase
        .from('membros')
        .update({
          nome_completo: editingData.nome_completo,
          nome_guerra: editingData.nome_guerra.toUpperCase(),
          status_membro: editingData.status_membro,
          numero_carteira: editingData.numero_carteira,
          data_inicio: editingData.data_inicio || null,
          telefone: editingData.telefone || null,
          endereco_cidade: editingData.endereco_cidade || null,
          endereco_estado: editingData.endereco_estado || null,
          foto_url: fotoUrl,
          padrinho_id: editingData.padrinho_id || null,
        })
        .eq('id', membroId);
      if (error) throw error;
      await handleSaveCargos(membroId);
      await carregarDados();
      setEditingId(null);
      setEditingData(null);
      setCargosSelecionados([]);
      setCargosOriginais([]);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      toastError('Erro ao atualizar dados do membro');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
    setCargosSelecionados([]);
    setCargosOriginais([]);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  // Manipulador de upload de foto
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isValidImageFile(file)) {
      toastWarning('Selecione uma imagem válida (jpg, jpeg, png, webp)');
      return;
    }
    setUploading(true);
    // Compressão e preview
    const compressed = await compressImage(file, 2);
    setPreviewUrl(URL.createObjectURL(compressed));
    setUploading(false);
  };

  const handleToggleAtivo = async (membro: Membro) => {
    try {
      const { error } = await supabase
        .from('membros')
        .update({ ativo: !membro.ativo })
        .eq('id', membro.id);

      if (error) throw error;

      // Atualizar lista local
      setMembros(membros.map(m => 
        m.id === membro.id ? { ...m, ativo: !m.ativo } : m
      ));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toastError('Erro ao alterar status do membro');
    }
  };

  const handleToggleAdmin = async (membro: Membro) => {
    // Não permitir remover admin de si mesmo
    if (membro.user_id === user?.id && membro.is_admin) {
      toastWarning('Você não pode remover seus próprios privilégios de administrador');
      return;
    }

    try {
      const { error } = await supabase
        .from('membros')
        .update({ is_admin: !membro.is_admin })
        .eq('id', membro.id);

      if (error) throw error;

      // Atualizar lista local
      setMembros(membros.map(m => 
        m.id === membro.id ? { ...m, is_admin: !m.is_admin } : m
      ));
    } catch (error) {
      console.error('Erro ao alterar admin:', error);
      toastError('Erro ao alterar privilégios de administrador');
    }
  };

  const membrosFiltrados = membros.filter(m => 
    m.nome_guerra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.numero_carteira.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-brand-red" />
                <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
                  Gerenciar Integrantes
                </h1>
              </div>
              <p className="text-gray-400 text-sm">
                Gerencie os integrantes do clube, cargos e permissões
              </p>
            </div>

            <Link
              to="/invite-member"
              className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-4 rounded-lg transition whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              Convidar Membro
            </Link>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar membro por nome, email ou carteira..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-gray border border-brand-red/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        {/* Lista de Integrantes */}
        <div className="space-y-4">
          {membrosFiltrados.map((membro) => (
            <div
              key={membro.id}
              className={`bg-brand-gray border ${
                membro.ativo ? 'border-brand-red/30' : 'border-gray-700'
              } rounded-xl p-5 ${!membro.ativo ? 'opacity-60' : ''}`}
            >
              {editingId === membro.id && editingData ? (
                /* Modo de Edição */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-oswald text-lg uppercase font-bold">Editando Integrante</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveMembro(membro.id)}
                        disabled={saving}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Upload de Foto */}
                    <div className="md:col-span-2">
                      <label className="block text-gray-400 text-xs uppercase mb-1">Foto do Membro (opcional)</label>
                      <div className="flex items-center gap-4">
                        <div>
                          {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-brand-red/30" />
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
                          <label htmlFor="foto-upload" className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-3 py-2 rounded cursor-pointer text-xs font-bold transition disabled:opacity-50">
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
                      <p className="text-gray-500 text-xs mt-2">Formatos aceitos: jpg, jpeg, png, webp. Tamanho máximo: 2MB.</p>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Nome Completo</label>
                      <input
                        type="text"
                        value={editingData.nome_completo}
                        onChange={(e) => setEditingData({ ...editingData, nome_completo: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Nome de Guerra</label>
                      <input
                        type="text"
                        value={editingData.nome_guerra}
                        onChange={(e) => setEditingData({ ...editingData, nome_guerra: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red uppercase"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Status</label>
                      <select
                        value={editingData.status_membro}
                        onChange={(e) => setEditingData({ ...editingData, status_membro: e.target.value as StatusMembroEnum })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                        value={editingData.numero_carteira}
                        onChange={(e) => setEditingData({ ...editingData, numero_carteira: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                        placeholder="000"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Data de Início</label>
                      <input
                        type="date"
                        value={editingData.data_inicio}
                        onChange={(e) => setEditingData({ ...editingData, data_inicio: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Telefone</label>
                      <input
                        type="tel"
                        value={editingData.telefone}
                        onChange={(e) => setEditingData({ ...editingData, telefone: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Cidade</label>
                      <input
                        type="text"
                        value={editingData.endereco_cidade}
                        onChange={(e) => setEditingData({ ...editingData, endereco_cidade: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-xs uppercase mb-1">Estado</label>
                      <select
                        value={editingData.endereco_estado}
                        onChange={(e) => setEditingData({ ...editingData, endereco_estado: e.target.value })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
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
                        value={editingData.padrinho_id || ''}
                        onChange={(e) => setEditingData({ ...editingData, padrinho_id: e.target.value || null })}
                        className="w-full bg-black border border-brand-red/30 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-red"
                        disabled={saving}
                      >
                        <option value="">Nenhum</option>
                        {padrinhosDisponiveis
                          .filter(p => p.id !== editingId) // Excluir o próprio membro da lista
                          .map((padrinho) => (
                            <option key={padrinho.id} value={padrinho.id}>
                              {padrinho.nome_guerra} - {padrinho.nome_completo}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Seção de Cargos */}
                  <div className="pt-4 border-t border-gray-700">
                    <h4 className="text-white font-oswald text-sm uppercase font-bold mb-3">Cargos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {todosOsCargos.map((cargo) => {
                        const isSelected = cargosSelecionados.includes(cargo.id);
                        return (
                          <button
                            key={cargo.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setCargosSelecionados(cargosSelecionados.filter(id => id !== cargo.id));
                              } else {
                                setCargosSelecionados([...cargosSelecionados, cargo.id]);
                              }
                            }}
                            disabled={saving}
                            className={`px-3 py-2 rounded text-xs transition ${
                              isSelected
                                ? 'bg-brand-red text-white border border-brand-red'
                                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-brand-red/50'
                            } disabled:opacity-50`}
                          >
                            <div className="font-semibold">{cargo.nome}</div>
                            <div className="text-xs opacity-75">{cargo.tipo_cargo}</div>
                          </button>
                        );
                      })}
                    </div>
                    {cargosSelecionados.length === 0 && (
                      <p className="text-gray-500 text-xs mt-2">Nenhum cargo selecionado</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-700">
                    <p className="text-gray-500 text-xs">
                      📧 Email: <span className="text-gray-400">{membro.email}</span> (não editável)
                    </p>
                  </div>
                </div>
              ) : (
                /* Modo de Visualização */
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Info Principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-oswald text-xl uppercase font-bold">
                        {membro.nome_guerra}
                      </h3>
                      {membro.is_admin && (
                        <span className="inline-flex items-center gap-1 bg-brand-red/20 border border-brand-red/50 text-brand-red px-2 py-0.5 rounded text-xs font-oswald uppercase">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                      {!membro.ativo && (
                        <span className="inline-flex items-center gap-1 bg-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs font-oswald uppercase">
                          Inativo
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-2">{membro.nome_completo}</p>
                    
                    {/* Badge de Status */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${STATUS_STYLES[membro.status_membro].bg} ${STATUS_STYLES[membro.status_membro].text}`}>
                        {membro.status_membro}
                      </span>
                      
                      {/* Cargos Ativos */}
                      {membro.cargos_ativos && membro.cargos_ativos.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {membro.cargos_ativos.map((cargo) => (
                            <span
                              key={cargo.id}
                              className="inline-flex px-2 py-1 rounded text-xs bg-gray-700 text-gray-300"
                              title={cargo.tipo_cargo}
                            >
                              {cargo.nome}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>📧 {membro.email}</span>
                      <span>🎫 {membro.numero_carteira}</span>
                      {membro.data_inicio && (
                        <span>📅 {new Date(membro.data_inicio).toLocaleDateString('pt-BR')}</span>
                      )}
                      {membro.telefone && <span>📱 {membro.telefone}</span>}
                      {membro.endereco_cidade && membro.endereco_estado && (
                        <span>📍 {membro.endereco_cidade} - {membro.endereco_estado}</span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMembro(membro)}
                      className="bg-brand-red/20 hover:bg-brand-red/30 text-brand-red p-2 rounded transition"
                      title="Editar membro"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleAdmin(membro)}
                      className={`${
                        membro.is_admin
                          ? 'bg-brand-red/20 hover:bg-brand-red/30 text-brand-red'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      } p-2 rounded transition`}
                      title={membro.is_admin ? 'Remover admin' : 'Tornar admin'}
                    >
                      {membro.is_admin ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleToggleAtivo(membro)}
                      className={`${
                        membro.ativo
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-green-600/20 hover:bg-green-600/30 text-green-500'
                      } px-3 py-2 rounded transition text-sm font-oswald uppercase`}
                      title={membro.ativo ? 'Desativar membro' : 'Ativar membro'}
                    >
                      {membro.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {membrosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
