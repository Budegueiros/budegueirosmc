import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { X, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EventoComFotos } from '../types/database.types';

export default function Eventos() {
  const [eventos, setEventos] = useState<EventoComFotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoComFotos | null>(null);
  const [fotoInicial, setFotoInicial] = useState(0);

  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async () => {
    try {
      // Buscar apenas eventos principais (marcados para exibição pública)
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos')
        .select('*')
        .eq('evento_principal', true)
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

  const abrirModal = (evento: EventoComFotos, fotoIndex: number = 0) => {
    setEventoSelecionado(evento);
    setFotoInicial(fotoIndex);
    setModalAberto(true);
    document.body.style.overflow = 'hidden';
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEventoSelecionado(null);
    document.body.style.overflow = 'auto';
  };

  if (loading) {
    return (
      <section className="relative py-12 md:py-20 min-h-screen pt-24 bg-black overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">Carregando eventos...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-12 md:py-20 min-h-screen pt-24 bg-black overflow-hidden">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 font-oswald uppercase">Eventos Realizados</h2>
          <div className="w-20 h-1 bg-brand-red mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Reviva os momentos marcantes que construíram a nossa história.</p>
        </div>
        
        {eventos.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>Nenhum evento realizado ainda.</p>
            <p className="text-sm mt-2">Os eventos passados aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {eventos.map((evento) => (
              <div key={evento.id} className="bg-brand-gray border-l-4 border-brand-red rounded-lg overflow-hidden">
                <div className="p-6">
                  {/* Cabeçalho do Evento */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl md:text-2xl font-bold text-white font-oswald flex-1">
                        {evento.nome}
                      </h3>
                      <div className="flex items-center gap-2 text-brand-red text-sm ml-4">
                        <Calendar className="w-4 h-4" />
                        <span className="whitespace-nowrap">{formatarData(evento.data_evento).toUpperCase()}</span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                      {evento.descricao || `${evento.tipo_evento} - ${evento.local_saida}`}
                    </p>
                  </div>

                  {/* Galeria de Miniaturas */}
                  {evento.fotos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-400 text-xs uppercase tracking-wider">Galeria de Fotos</span>
                        <span className="bg-brand-red/20 text-brand-red text-xs px-2 py-1 rounded">
                          {evento.fotos.length}
                        </span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {evento.fotos.slice(0, 3).map((foto, index) => (
                          <button
                            key={foto.id}
                            onClick={() => abrirModal(evento, index)}
                            className="relative flex-shrink-0 w-32 h-24 overflow-hidden rounded-lg group cursor-pointer"
                          >
                            <img
                              src={foto.foto_url}
                              alt={foto.legenda || evento.nome}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                            {index === 2 && evento.fotos.length > 3 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">+{evento.fotos.length - 3}</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback caso não tenha fotos na galeria mas tenha foto de capa */}
                  {evento.fotos.length === 0 && evento.foto_capa_url && (
                    <div className="mt-4">
                      <img
                        src={evento.foto_capa_url}
                        alt={evento.nome}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call-to-Action */}
      <div className="container mx-auto px-4 max-w-5xl mt-16 mb-12">
        <div className="border-t border-brand-red/30 pt-8">
          <div className="bg-brand-gray border border-brand-red/20 rounded-lg p-8">
            <p className="text-white text-center text-lg md:text-xl italic leading-relaxed">
              "Gostou do que viu por aqui? Fique de olho na agenda e venha viver o próximo capítulo dessa história junto com o Budegueiros MC."
            </p>
          </div>
        </div>
      </div>

      {/* Modal com Carrossel */}
      {modalAberto && eventoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          <button
            onClick={fecharModal}
            className="absolute top-4 right-4 z-50 bg-brand-red hover:bg-red-700 text-white rounded-full p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-full max-w-5xl">
            <div className="mb-4 text-center">
              <h3 className="text-2xl font-bold text-white font-oswald mb-1">
                {eventoSelecionado.nome}
              </h3>
              <p className="text-brand-red text-sm">
                {formatarData(eventoSelecionado.data_evento)}
              </p>
            </div>

            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              initialSlide={fotoInicial}
              className="rounded-lg"
              style={{ height: '70vh' }}
            >
              {eventoSelecionado.fotos.map((foto) => (
                <SwiperSlide key={foto.id}>
                  <img
                    src={foto.foto_url}
                    alt={foto.legenda || eventoSelecionado.nome}
                    className="w-full h-full object-contain"
                  />
                  {foto.legenda && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 text-center">
                      {foto.legenda}
                    </div>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </section>
  );
}