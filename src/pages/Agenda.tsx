import EventCard from '../components/EventCard';


export default function Agenda() {
    return (
        <section id="agenda" className="py-20 bg-zinc-900 min-h-dvh">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Próximos Encontros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">

            {[
              {
                date: '12 de Janeiro',
                title: 'Reunião Mensal - Exclusivo para Membros',
                destino: 'Sede do Clube',
                time: '11:00',
                mapUrl: 'https://maps.app.goo.gl/AWvor6LWMKCwUZ7H9'
              },
              {
                date: '19 de Janeiro',
                title: 'Caetanópolis - Aberto a todos',
                origem: 'Sede do Clube',
                destino: 'Linguiça da Bete',
                time: 'Saída: 09:00',
                km: '104',
                mapUrl: 'https://maps.app.goo.gl/Wgf8A5vUoVWi6um28'
              },
              {
                date: '26 de Janeiro',
                title: 'Juatuba - Aberto a todos',
                origem: 'Sede do Clube',
                destino: 'Pesque e solte Peixe & Boi',
                time: 'Saída: 10:00',
                km: '48',
                mapUrl: 'https://maps.app.goo.gl/FZgCKT8o6w5FABEy7'
              },
              {
                date: '02 de Fevereiro',
                title: 'Reunião Mensal - Exclusivo para Membros',
                destino: 'Sede do Clube',
                time: '11:00',
                mapUrl: 'https://maps.app.goo.gl/AWvor6LWMKCwUZ7H9'
              },
            ].map((event, index) => (

              <EventCard key={index}
                title={event.title}
                date={event.date}
                origem={event.origem}
                destino={event.destino}
                time={event.time}
                km={event.km}
                mapUrl={event.mapUrl}
              />
            ))}
          </div>
        </div>
      </section>
    )
}