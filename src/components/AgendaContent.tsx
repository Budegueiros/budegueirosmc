import { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AgendaEventCard } from './AgendaEventCard';
import { useAuth } from '../contexts/AuthContext';

interface Evento {
  id: string;
  nome: string;
  descricao: string | null;
  tipo_evento: string;
  data_evento: string;
  hora_saida: string | null;
  local_saida: string;
  local_destino: string | null;
  distancia_km: number | null;
  foto_capa_url: string | null;
  cidade: string;
  estado: string;
}

interface MembroData {
  id: string;
  nome_guerra: string;
}

interface AgendaContentProps {
  isLoggedIn?: boolean;
}

export default function AgendaContent({ isLoggedIn = false }: AgendaContentProps) {
  const { user } = useAuth();
  const [membro, setMembro] = useState<MembroData | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Buscar eventos (público - não requer autenticação)
        const { data: eventosData, error: eventosError } = await supabase
          .from('eventos')
          .select('*')
          .eq('status', 'Ativo')
          .order('data_evento', { ascending: true });

        if (eventosError) {
          console.error('Erro ao buscar eventos:', eventosError);
          throw eventosError;
        }
        
        setEventos(eventosData || []);

        // Buscar dados do membro (só se estiver autenticado)
        if (user) {
          const { data: membroData, error: membroError } = await supabase
            .from('membros')
            .select('id, nome_guerra')
            .eq('user_id', user.id)
            .single();

          if (membroError) {
            console.error('Erro ao buscar membro:', membroError);
          } else {
            setMembro(membroData);
          }
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [user]);

  const handleRSVP = async (eventId: string, status: 'confirmed' | 'maybe') => {
    if (!membro) {
      alert('Você precisa estar logado para confirmar presença');
      return;
    }
    
    // TODO: Implementar lógica de RSVP no banco de dados
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const filteredEvents = eventos.filter(e => {
    const eventDate = new Date(e.data_evento + 'T00:00:00');
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    if (activeTab === 'upcoming') {
      return eventDateOnly >= today;
    }
    return eventDateOnly < today;
  }).sort((a, b) => {
    const dateA = new Date(a.data_evento).getTime();
    const dateB = new Date(b.data_evento).getTime();
    return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  if (loading) {
    return (
      <div className='flex justify-center items-center text-center text-white h-screen'>
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <section className="relative py-20 bg-zinc-900 min-h-screen pt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center py-16 bg-red-900/20 rounded-lg border border-red-900/50">
              <h3 className="text-white font-bold text-lg mb-2">Erro ao carregar dados</h3>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative bg-zinc-900 min-h-screen overflow-hidden ${isLoggedIn ? 'py-8' : 'py-20 pt-24'}`}>
      <div className={`container mx-auto px-4 ${isLoggedIn ? '' : 'pl-16 md:pl-24'}`}>
        <div className="animate-fade-in max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 font-oswald">
              <Calendar className="text-red-600" /> Agenda & Eventos
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800 mb-8 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'upcoming' 
                  ? 'border-red-600 text-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              PRÓXIMOS ROLÊS
            </button>
            <button 
              onClick={() => setActiveTab('past')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'past' 
                  ? 'border-red-600 text-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              HISTÓRICO
            </button>
          </div>

          {/* Content */}
          <div>
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <AgendaEventCard 
                  key={event.id}
                  event={event}
                  currentMember={membro}
                  onRSVP={handleRSVP}
                />
              ))
            ) : (
              <div className="text-center py-16 bg-[#1a1d23]/50 rounded-lg border border-dashed border-gray-800 flex flex-col items-center">
                <Filter className="text-gray-600 mb-4" size={48} />
                <h3 className="text-white font-bold text-lg">Nenhum evento encontrado</h3>
                <p className="text-gray-500 mt-2">
                  {activeTab === 'upcoming' 
                    ? 'Não há eventos agendados para os próximos dias.' 
                    : 'Nenhum evento passado registrado.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
