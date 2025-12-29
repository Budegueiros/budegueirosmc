import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bike, MapPin, Phone, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { StatusMembroEnum } from '../types/database.types';

export default function CompleteProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Dados do Membro
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeGuerra, setNomeGuerra] = useState('');
  const [statusMembro, setStatusMembro] = useState<StatusMembroEnum>('Aspirante');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  // Dados da Moto
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [ano, setAno] = useState('');
  const [cor, setCor] = useState('');

  const handleSubmitMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nomeGuerra || !nomeCompleto) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setStep(2); // Avançar para dados da moto
  };

  const handleSubmitCompleto = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) throw new Error('Usuário não autenticado');

      // Gerar número de carteira único
      const ano = new Date().getFullYear();
      const numeroCarteira = `BMC-${ano}-${Math.floor(Math.random() * 9000) + 1000}`;

      // 1. Inserir dados do membro
      const { data: membroData, error: membroError } = await supabase
        .from('membros')
        .insert({
          user_id: user.id,
          nome_completo: nomeCompleto,
          nome_guerra: nomeGuerra.toUpperCase(),
          status_membro: statusMembro,
          numero_carteira: numeroCarteira,
          telefone: telefone || null,
          email: user.email,
          endereco_cidade: cidade || null,
          endereco_estado: estado || null,
        })
        .select()
        .single();

      if (membroError) throw membroError;

      // 2. Se preencheu dados da moto, inserir
      if (marca && modelo && placa && ano) {
        const { error: motoError } = await supabase
          .from('motos')
          .insert({
            membro_id: membroData.id,
            marca: marca,
            modelo: modelo,
            placa: placa.toUpperCase(),
            ano: Number(ano),
            cor: cor || null,
          });

        if (motoError) throw motoError;
      }

      // Redirecionar para o dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      setError(err.message || 'Erro ao salvar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/BT.png" alt="Budegueiros MC" className="w-20 h-20" />
          </div>
          <h1 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
            Bem-vindo, Irmão!
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Complete seu perfil para acessar a área do membro
          </p>
        </div>

        {/* Progresso */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-brand-red' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full border-2 ${step >= 1 ? 'border-brand-red bg-brand-red/20' : 'border-gray-600'} flex items-center justify-center font-bold`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="hidden md:inline font-oswald uppercase text-sm">Dados Pessoais</span>
            </div>
            <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-brand-red' : 'bg-gray-600'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-brand-red' : 'text-gray-600'}`}>
              <div className={`w-8 h-8 rounded-full border-2 ${step >= 2 ? 'border-brand-red bg-brand-red/20' : 'border-gray-600'} flex items-center justify-center font-bold`}>
                2
              </div>
              <span className="hidden md:inline font-oswald uppercase text-sm">Minha Máquina</span>
            </div>
          </div>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div className="bg-red-950/30 border border-brand-red/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        )}

        {/* STEP 1: Dados Pessoais */}
        {step === 1 && (
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-brand-red" />
              <h2 className="text-white font-oswald text-xl uppercase font-bold">
                Seus Dados
              </h2>
            </div>

            <form onSubmit={handleSubmitMembro} className="space-y-5">
              
              {/* Nome Completo */}
              <div>
                <label htmlFor="nomeCompleto" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                  Nome Completo *
                </label>
                <input
                  id="nomeCompleto"
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  required
                  className="w-full bg-black border border-brand-red/30 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px]"
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Nome de Guerra */}
              <div>
                <label htmlFor="nomeGuerra" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                  Nome de Guerra *
                </label>
                <input
                  id="nomeGuerra"
                  type="text"
                  value={nomeGuerra}
                  onChange={(e) => setNomeGuerra(e.target.value)}
                  required
                  className="w-full bg-black border border-brand-red/30 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px] uppercase"
                  placeholder="Seu apelido na estrada"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Como você quer ser chamado na irmandade
                </p>
              </div>

              {/* Status Inicial */}
              <div>
                <label htmlFor="status" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                  Status Inicial
                </label>
                <select
                  id="status"
                  value={statusMembro}
                  onChange={(e) => setStatusMembro(e.target.value as StatusMembroEnum)}
                  className="w-full bg-black border border-brand-red/30 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px]"
                >
                  <option value="Aspirante">Aspirante</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Brasionado">Brasionado</option>
                  <option value="Nomade">Nômade</option>
                </select>
                <p className="text-gray-500 text-xs mt-1">
                  O administrador poderá alterar seu status posteriormente
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Telefone */}
                <div>
                  <label htmlFor="telefone" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red/50">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      id="telefone"
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full bg-black border border-brand-red/30 rounded-lg pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px]"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* Cidade */}
                <div>
                  <label htmlFor="cidade" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                    Cidade
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red/50">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <input
                      id="cidade"
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full bg-black border border-brand-red/30 rounded-lg pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px]"
                      placeholder="Sua cidade"
                    />
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div>
                <label htmlFor="estado" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                  Estado
                </label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full bg-black border border-brand-red/30 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px]"
                >
                  <option value="">Selecione o estado</option>
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="PR">Paraná</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="RS">Rio Grande do Sul</option>
                  {/* Adicione mais estados conforme necessário */}
                </select>
              </div>

              {/* Botão Continuar */}
              <button
                type="submit"
                className="w-full bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-base py-4 px-6 rounded-lg transition-all duration-200 active:scale-95 shadow-lg shadow-brand-red/30 min-h-[52px]"
              >
                Continuar para Dados da Moto
              </button>

            </form>
          </div>
        )}

        {/* STEP 2: Dados da Moto */}
        {step === 2 && (
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Bike className="w-6 h-6 text-brand-red" />
              <h2 className="text-white font-oswald text-xl uppercase font-bold">
                Minha Máquina
              </h2>
            </div>

            <form onSubmit={handleSubmitCompleto} className="space-y-5">
              
              <p className="text-gray-400 text-sm mb-4">
                Cadastre sua moto (opcional - você pode fazer isso depois)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Marca */}
                <div>
                  <label htmlFor="marca" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                    Marca
                  </label>
                  <input
                    id="marca"
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full bg-black border border-brand-red/30 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px]"
                    placeholder="Honda, Yamaha, etc"
                  />
                </div>

                {/* Modelo */}
                <div>
                  <label htmlFor="modelo" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                    Modelo
                  </label>
                  <input
                    id="modelo"
                    type="text"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full bg-black border border-brand-red/30 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px]"
                    placeholder="CG 160, XRE 300, etc"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Placa */}
                <div>
                  <label htmlFor="placa" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                    Placa
                  </label>
                  <input
                    id="placa"
                    type="text"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    maxLength={8}
                    className="w-full bg-black border border-brand-red/30 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px] uppercase font-mono"
                    placeholder="ABC-1234"
                  />
                </div>

                {/* Ano */}
                <div>
                  <label htmlFor="ano" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                    Ano
                  </label>
                  <input
                    id="ano"
                    type="number"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full bg-black border border-brand-red/30 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px]"
                    placeholder="2020"
                  />
                </div>

                {/* Cor */}
                <div>
                  <label htmlFor="cor" className="block text-gray-400 text-sm uppercase tracking-wide mb-2">
                    Cor
                  </label>
                  <input
                    id="cor"
                    type="text"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className="w-full bg-black border border-brand-red/30 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-brand-red transition min-h-[52px]"
                    placeholder="Preta, Vermelha, etc"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 bg-transparent border-2 border-brand-red/30 hover:bg-brand-red/10 text-white font-oswald uppercase font-bold text-sm py-4 px-6 rounded-lg transition min-h-[52px] disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-brand-red hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-oswald uppercase font-bold text-base py-4 px-6 rounded-lg transition-all duration-200 active:scale-95 shadow-lg shadow-brand-red/30 min-h-[52px] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Finalizar Cadastro'
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
