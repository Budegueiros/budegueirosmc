import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, CheckCircle, AlertCircle, Bike, MapPin, Users, LogOut, Loader2, UserPlus, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { supabase } from '../lib/supabase';

interface MembroData {
  nome_completo: string;
  nome_guerra: string;
  cargo: string;
  foto_url: string | null;
  data_inicio: string;
  numero_carteira: string;
}

interface MotoData {
  modelo: string;
  marca: string;
  placa: string;
  ano: number;
}

interface EventoData {
  id: string;
  nome: string;
  data_evento: string;
  local_saida: string;
  cidade: string;
  estado: string;
  distancia_km: number | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [membro, setMembro] = useState<MembroData | null>(null);
  const [moto, setMoto] = useState<MotoData | null>(null);
  const [proximoEvento, setProximoEvento] = useState<EventoData | null>(null);
  const [mensalidadeEmDia, setMensalidadeEmDia] = useState(true);
  const [confirmados, setConfirmados] = useState(0);

  useEffect(() => {
    carregarDados();
  }, [user]);

  const carregarDados = async () => {
    if (!user) return;

    try {
      // Buscar dados do membro
      const { data: membroData, error: membroError } = await supabase
        .from('membros')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Se não encontrou o membro, redirecionar para completar perfil
      if (membroError || !membroData) {
        navigate('/complete-profile');
        return;
      }
      
      setMembro(membroData);

      // Buscar moto ativa do membro
      if (membroData) {
        const { data: motoData } = await supabase
          .from('motos')
          .select('*')
          .eq('membro_id', membroData.id)
          .eq('ativa', true)
          .single();

        setMoto(motoData);

        // Buscar próximo evento
        const { data: eventoData } = await supabase
          .from('eventos')
          .select('*')
          .eq('status', 'Ativo')
          .gte('data_evento', new Date().toISOString().split('T')[0])
          .order('data_evento', { ascending: true })
          .limit(1)
          .single();

        setProximoEvento(eventoData);

        // Buscar confirmados do evento
        if (eventoData) {
          const { count } = await supabase
            .from('confirmacoes_presenca')
            .select('*', { count: 'exact', head: true })
            .eq('evento_id', eventoData.id)
            .eq('status', 'Confirmado');

          setConfirmados(count || 0);
        }

        // Verificar status da mensalidade atual
        const mesAtual = new Date().toISOString().slice(0, 7) + '-01';
        const { data: mensalidadeData } = await supabase
          .from('mensalidades')
          .select('status')
          .eq('membro_id', membroData.id)
          .eq('mes_referencia', mesAtual)
          .single();

        setMensalidadeEmDia(mensalidadeData?.status === 'Pago');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Se não tem dados do membro, redirecionar para completar perfil
  if (!loading && !membro && user) {
    navigate('/complete-profile');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-oswald uppercase text-sm tracking-wider">
            Carregando seus dados...
          </p>
        </div>
      </div>
    );
  }

  if (!membro) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      {/* Container Principal - Mobile First */}
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        
        {/* Saudação Personalizada com Botão de Logout */}
        <div className="pt-4 flex items-start justify-between">
          <div>
            <h1 className="text-white text-lg font-light">
              Fala, Companheiro!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-brand-red font-oswald text-3xl md:text-4xl uppercase font-bold">
                {membro.nome_guerra}
              </h2>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 bg-brand-red/20 border border-brand-red/50 text-brand-red px-2 py-1 rounded text-xs font-oswald uppercase">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Tudo pronto para rodar?
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/edit-profile"
              className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm font-oswald uppercase"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Editar Perfil</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-brand-gray border border-brand-red/30 hover:bg-brand-red/10 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition text-sm font-oswald uppercase"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Painel de Admin - Apenas para administradores */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-brand-red/10 to-transparent border border-brand-red/30 rounded-xl p-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-white font-oswald text-lg uppercase font-bold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-brand-red" />
                    Painel do Administrador
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Gerencie membros e eventos do clube
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/manage-members"
                  className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-4 rounded-lg transition"
                >
                  <Users className="w-4 h-4" />
                  Gerenciar Membros
                </Link>
                
                <Link
                  to="/invite-member"
                  className="flex items-center gap-2 bg-brand-gray border border-brand-red/30 hover:bg-brand-red/10 text-white font-oswald uppercase font-bold text-sm py-3 px-4 rounded-lg transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Convidar Membro
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* CARTEIRINHA DIGITAL - Estilo Cartão Premium */}
        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-brand-red/30">
          {/* Bordas vermelhas nas laterais */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-0 left-0 w-3 h-full bg-gradient-to-r from-brand-red to-transparent"></div>
            <div className="absolute top-0 right-0 w-3 h-full bg-gradient-to-l from-brand-red to-transparent"></div>
          </div>
          
          <div className="relative p-6 pb-8">
            {/* Header - Logo e Chip */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-white font-oswald text-xl md:text-2xl uppercase font-bold tracking-wider leading-tight">
                  BUDEGUEIROS
                </h3>
                <p className="text-brand-red text-sm md:text-base font-oswald uppercase tracking-widest">
                  MOTO CLUBE
                </p>
              </div>
              
              {/* Chip dourado */}
              <div className="w-12 h-10 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-yellow-300/30 to-transparent"></div>
                <div className="absolute inset-2 border border-yellow-600/50 rounded-sm"></div>
              </div>
            </div>

            {/* Conteúdo Principal - Foto e Dados */}
            <div className="flex items-start gap-6">
              {/* Foto do Membro com Badge de Ano */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-3 border-gray-700 overflow-hidden bg-gray-800 flex items-center justify-center">
                  {membro.foto_url ? (
                    <img 
                      src={membro.foto_url} 
                      alt={membro.nome_guerra}
                      className="w-full h-full object-cover grayscale"
                    />
                  ) : (
                    <div className="text-gray-500 text-4xl font-bold">
                      {membro.nome_guerra[0]}
                    </div>
                  )}
                </div>
                {/* Badge com o ano de entrada */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-red text-white font-oswald font-bold text-sm px-4 py-1 rounded-full shadow-lg">
                  {new Date(membro.data_inicio).getFullYear()}
                </div>
              </div>

              {/* Informações */}
              <div className="flex-1 space-y-3 pt-1">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Nome de Guerra</p>
                  <h2 className="text-white font-oswald text-3xl md:text-4xl uppercase font-bold leading-none tracking-wide">
                    {membro.nome_guerra}
                  </h2>
                </div>

                {/* Cargo Badge */}
                <div>
                  <span className="inline-block bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded text-sm font-oswald uppercase tracking-wide">
                    {membro.cargo}
                  </span>
                </div>

                {/* Localização */}
                {(membro.endereco_cidade || membro.endereco_estado) && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Shield className="w-4 h-4" />
                    <span className="uppercase font-medium">
                      {membro.endereco_cidade && membro.endereco_estado 
                        ? `${membro.endereco_cidade} - ${membro.endereco_estado}`
                        : membro.endereco_cidade || membro.endereco_estado}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé - Número da Carteira */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs uppercase tracking-wide">Nº Carteira</p>
                  <p className="text-brand-red font-mono text-sm font-bold tracking-wider mt-0.5">
                    {membro.numero_carteira}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-xs uppercase tracking-wide">Membro desde</p>
                  <p className="text-gray-400 text-sm font-semibold mt-0.5">
                    {formatarData(membro.data_inicio)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATUS FINANCEIRO */}
        <div className={`${
          mensalidadeEmDia 
            ? 'bg-green-950/30 border-green-600/50' 
            : 'bg-red-950/30 border-brand-red/50'
        } border-2 rounded-xl p-5`}>
          <div className="flex items-start gap-4">
            {mensalidadeEmDia ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-brand-red flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <h3 className="text-white font-oswald text-lg uppercase font-bold">
                {mensalidadeEmDia ? 'Contribuição em Dia' : 'Atenção Necessária'}
              </h3>
              <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                {mensalidadeEmDia 
                  ? 'Sua contribuição fortalece a irmandade. Valeu, parceiro!' 
                  : 'Regularize sua contribuição para manter os benefícios ativos.'}
              </p>
            </div>
          </div>
        </div>

        {/* PRÓXIMA RODADA */}
        {proximoEvento ? (
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl overflow-hidden">
            <div className="bg-brand-red/10 px-5 py-3 border-b border-brand-red/30">
              <h3 className="text-brand-red font-oswald text-sm uppercase font-bold tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Próxima Rodada
              </h3>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-white font-oswald text-xl md:text-2xl uppercase font-bold leading-tight">
                  {proximoEvento.nome}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-brand-red flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-gray-500 text-xs uppercase">Data</p>
                    <p className="text-white font-semibold text-sm">
                      {formatarData(proximoEvento.data_evento)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-brand-red flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-gray-500 text-xs uppercase">Confirmados</p>
                    <p className="text-white font-semibold text-sm">
                      {confirmados} irmãos
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-red flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs uppercase">Local</p>
                  <p className="text-white font-semibold text-sm">
                    {proximoEvento.local_saida} - {proximoEvento.cidade}/{proximoEvento.estado}
                  </p>
                  {proximoEvento.distancia_km && (
                    <p className="text-gray-400 text-xs mt-0.5">
                      {proximoEvento.distancia_km} km de distância
                    </p>
                  )}
                </div>
              </div>

              {/* Botão de Confirmação - Grande e acessível */}
              <button className="w-full bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-base py-4 px-6 rounded-lg transition-all duration-200 active:scale-95 shadow-lg shadow-brand-red/30 min-h-[52px]">
                Confirmar Presença
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6 text-center">
            <Calendar className="w-12 h-12 text-brand-red/30 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Nenhum evento programado no momento.
            </p>
          </div>
        )}

        {/* MINHA MÁQUINA */}
        {moto ? (
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl overflow-hidden">
            <div className="bg-brand-red/10 px-5 py-3 border-b border-brand-red/30">
              <h3 className="text-brand-red font-oswald text-sm uppercase font-bold tracking-wider flex items-center gap-2">
                <Bike className="w-4 h-4" />
                Minha Máquina
              </h3>
            </div>
            
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-oswald text-lg uppercase font-bold">
                    {moto.marca} {moto.modelo}
                  </h4>
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <p className="text-gray-500 text-xs uppercase">Placa</p>
                      <p className="text-white font-mono font-semibold text-sm">
                        {moto.placa}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase">Ano</p>
                      <p className="text-white font-semibold text-sm">
                        {moto.ano}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Bike className="w-12 h-12 text-brand-red/30" />
              </div>

              {/* Botão de Atualizar Dados */}
              <button className="w-full mt-4 bg-transparent border-2 border-brand-red/50 hover:bg-brand-red/10 text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition-all duration-200 min-h-[48px]">
                Atualizar Dados da Moto
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-brand-gray border border-brand-red/30 rounded-xl p-6 text-center">
            <Bike className="w-12 h-12 text-brand-red/30 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">
              Nenhuma moto cadastrada.
            </p>
            <button className="bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-6 rounded-lg transition">
              Cadastrar Moto
            </button>
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <button className="bg-brand-gray border border-brand-red/30 hover:bg-brand-red/10 text-white font-oswald uppercase font-bold text-sm py-4 px-4 rounded-lg transition-all duration-200 min-h-[52px]">
            Ver Eventos
          </button>
          <button className="bg-brand-gray border border-brand-red/30 hover:bg-brand-red/10 text-white font-oswald uppercase font-bold text-sm py-4 px-4 rounded-lg transition-all duration-200 min-h-[52px]">
            Contato
          </button>
        </div>

      </div>
    </div>
  );
}
