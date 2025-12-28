import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, CheckCircle, AlertCircle, Bike, MapPin, Users, LogOut, Loader2, UserPlus, Shield } from 'lucide-react';
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

      if (membroError) throw membroError;
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-brand-gray border border-brand-red/30 hover:bg-brand-red/10 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition text-sm font-oswald uppercase"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>

        {/* Painel de Admin - Apenas para administradores */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-brand-red/10 to-transparent border border-brand-red/30 rounded-xl p-5">
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
              <Link
                to="/invite-member"
                className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-oswald uppercase font-bold text-sm py-3 px-4 rounded-lg transition whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Convidar Membro
              </Link>
            </div>
          </div>
        )}

        {/* CARTEIRINHA DIGITAL - Destaque Premium */}
        <div className="relative bg-gradient-to-br from-brand-gray via-brand-dark to-black border-2 border-brand-red rounded-xl overflow-hidden shadow-2xl shadow-brand-red/20">
          {/* Detalhe visual de tarja */}
          <div className="absolute top-0 left-0 w-2 h-full bg-brand-red"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-full blur-3xl"></div>
          
          <div className="relative p-6 space-y-4">
            {/* Header da Carteirinha */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-brand-red text-xs font-oswald uppercase tracking-wider">
                  Carteira de Membro
                </p>
                <h3 className="text-white font-oswald text-xl uppercase font-bold mt-1">
                  Budegueiros MC
                </h3>
              </div>
              
              {/* Foto do Membro */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg border-2 border-brand-red overflow-hidden bg-brand-gray flex items-center justify-center">
                {membro.foto_url ? (
                  <img 
                    src={membro.foto_url} 
                    alt={membro.nome_guerra}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-brand-red text-3xl font-bold">
                    {membro.nome_guerra[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Informações do Membro */}
            <div className="space-y-3 border-t border-brand-red/20 pt-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wide">Nome de Guerra</p>
                <p className="text-white font-oswald text-2xl uppercase font-bold">
                  {membro.nome_guerra}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Cargo</p>
                  <p className="text-white font-semibold text-sm mt-0.5">
                    {membro.cargo}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Desde</p>
                  <p className="text-white font-semibold text-sm mt-0.5">
                    {formatarData(membro.data_inicio)}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-gray-500 text-xs uppercase tracking-wide">Nº Carteira</p>
                <p className="text-brand-red font-mono text-sm font-bold mt-0.5 tracking-wider">
                  {membro.numero_carteira}
                </p>
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
