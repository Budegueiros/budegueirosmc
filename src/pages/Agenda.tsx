import { useState, useEffect } from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import EventCard from '../components/EventCard';

export default function Agenda() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_URL_API}?Authorization=${import.meta.env.VITE_APP_API_KEY}&route=agenda`,
          {
            method: 'GET'
          });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className='flex justify-center items-center text-center text-white h-dvh'>Loading...</div>;
  if (error) return <div className='flex justify-center items-center text-center text-white h-dvh'>Error: {error.message}</div>;

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">

          {data && data.map((event, index) => (

            <EventCard key={index}
              title={event.titulo}
              type={event.tipo}
              date={event.dia}
              month={event.Mes}
              origem={event.origem}
              destino={event.destino}
              time={event.hora}
              km={event.kms}
              mapUrl={event.googleMaps}
            />
          ))}
        </div>
      </div>
    </section>
  )
}