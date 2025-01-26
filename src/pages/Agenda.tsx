import { useState, useEffect } from 'react';
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
    <section id="agenda" className="py-20 bg-zinc-900 min-h-dvh">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-12 text-center">Próximos Encontros</h2>
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