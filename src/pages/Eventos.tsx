import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { EventoComFotos } from '../types/database.types';

export default function Eventos() {
  const [eventos, setEventos] = useState<EventoComFotos[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async () => {
    try {
      // Buscar eventos passados com status "Realizado" ou "Ativo" com data passada
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos')
        .select('*')
        .or(`status.eq.Realizado,and(status.eq.Ativo,data_evento.lt.${hoje})`)
        .order('data_evento', { ascending: false });

      if (eventosError) throw eventosError;

      // Para cada evento, buscar suas fotos
      const eventosComFotos: EventoComFotos[] = await Promise.all(
        (eventosData || []).map(async (evento) => {
          const { data: fotosData, error: fotosError } = await supabase
            .from('evento_fotos')
            .select('*')
            .eq('evento_id', evento.id)
            .eq('ativo', true)
            .order('ordem', { ascending: true });

          if (fotosError) {
            console.error('Erro ao buscar fotos do evento:', fotosError);
          }

          return {
            ...evento,
            fotos: fotosData || []
          };
        })
      );

      setEventos(eventosComFotos);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <section className="relative py-12 md:py-20 min-h-screen pt-24 bg-black overflow-hidden">
        <Sidebar />
        <div className="container mx-auto px-4 pl-16 md:pl-24">
          <div className="text-center text-white">Carregando eventos...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-12 md:py-20 min-h-screen pt-24 bg-black overflow-hidden">
      <Sidebar />

      <div className="container mx-auto px-4 pl-16 md:pl-24">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center font-oswald">Eventos Realizados</h2>
        
        {eventos.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>Nenhum evento realizado ainda.</p>
            <p className="text-sm mt-2">Os eventos passados aparecerão aqui.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {eventos.map((evento) => (
              <div key={evento.id} className="flex flex-col gap-4">
                <div className="text-center px-4">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{evento.nome}</h3>
                  <p className="text-gray-300 text-sm md:text-base mb-1">
                    {evento.descricao || `${evento.tipo_evento} - ${evento.local_saida}`}
                  </p>
                  <p className="text-brand-red text-sm">
                    Realizado em {formatarData(evento.data_evento)}
                  </p>
                </div>
                
                {/* Galeria de fotos do evento */}
                {evento.fotos.length > 0 ? (
                  <div className="relative h-64 md:h-80 group overflow-hidden rounded-lg">
                    <Swiper
                      modules={[Navigation, Pagination, Autoplay]}
                      navigation
                      pagination={{ clickable: true }}
                      autoplay={{ delay: 3000, disableOnInteraction: false }}
                      className="h-full w-full"
                    >
                      {evento.fotos.map((foto) => (
                        <SwiperSlide key={foto.id}>
                          <img
                            src={foto.foto_url}
                            alt={foto.legenda || evento.nome}
                            className="w-full h-full object-cover"
                          />
                          {foto.legenda && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 text-sm">
                              {foto.legenda}
                            </div>
                          )}
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                ) : evento.foto_capa_url ? (
                  // Fallback: mostrar foto de capa se não houver fotos na galeria
                  <div className="relative h-64 md:h-80 overflow-hidden rounded-lg">
                    <img
                      src={evento.foto_capa_url}
                      alt={evento.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative h-64 md:h-80 bg-gray-800 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Sem fotos disponíveis</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}