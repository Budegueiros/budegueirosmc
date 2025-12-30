import { useState, useEffect } from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EventCard from '../components/EventCard';

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

export default function Agenda() {

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('status', 'Ativo')
          .gte('data_evento', new Date().toISOString().split('T')[0])
          .order('data_evento', { ascending: true });

        if (error) throw error;
        setEventos(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  if (loading) return <div className='flex justify-center items-center text-center text-white h-dvh'>Loading...</div>;
  if (error) return <div className='flex justify-center items-center text-center text-white h-dvh'>Error: {error}</div>;

  return (
    <section className="relative py-20 bg-zinc-900 min-h-screen pt-24 overflow-hidden">
      {/* Barra Lateral Vermelha com Redes Sociais */}
      <div className="fixed left-0 top-0 h-full w-12 md:w-16 bg-brand-red z-40 flex flex-col items-center justify-between py-8">
        {/* Texto Vertical "BUDEGUEIROS" */}
        <div className="flex-1 flex items-center justify-center">
          <span className="transform -rotate-90 origin-center text-white font-oswald font-bold text-sm md:text-base tracking-[0.3em] whitespace-nowrap">
            BUDEGUEIROS
          </span>
        </div>

        {/* Ícones Sociais */}
        <div className="flex flex-col gap-6 pb-4">
          <a 
            href="https://facebook.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:text-brand-dark transition"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a 
            href="https://www.instagram.com/budegueirosmc/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:text-brand-dark transition"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a 
            href="https://twitter.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:text-brand-dark transition"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 pl-16 md:pl-24">
        <h2 className="text-4xl font-bold mb-12 text-center font-oswald">Próximos Encontros</h2>
        
        {eventos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum evento agendado no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {eventos.map((evento) => {
              const dataEvento = new Date(evento.data_evento + 'T00:00:00');
              const dia = dataEvento.getDate().toString();
              const mes = dataEvento.toLocaleDateString('pt-BR', { month: 'long' });
              
              return (
                <EventCard 
                  key={evento.id}
                  title={evento.nome}
                  type={evento.tipo_evento}
                  date={dia}
                  month={mes}
                  origem={evento.local_saida}
                  destino={evento.local_destino || `${evento.cidade} - ${evento.estado}`}
                  time={evento.hora_saida || '00:00'}
                  km={evento.distancia_km?.toString()}
                  descricao={evento.descricao ?? ''}
                  fotoCapa={evento.foto_capa_url}
                  mapUrl={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evento.local_saida)}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  )
}