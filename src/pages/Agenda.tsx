import { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';


export default function Agenda() {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://script.googleusercontent.com/macros/echo?user_content_key=JQ-xhRrWbVIMN-UM4xXsXWNo4svEpBrHjl9cHTxSy5R3qAl2_UPkHrUFQT39yj8QKU5wRsQPw2KDqZJVvONkusK4mUVtA3yUm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnCwde3IyQBDWzwvy2bu5_-K3SL6aU6l7strFn_1slwVsfx6Y_u4sbl2ScrpJDYgCKxV48OH3SAL96TLGqs9n2NhOuEbufL4BfQ&lib=M1-3B5857F6Ryg5HIZfa8d7CA5b8gKEx2');
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