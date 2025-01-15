export default function Eventos() {
    return (
        <section id="eventos" className="py-20 h-dvh">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Eventos Realizados</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative h-80 group overflow-hidden rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1622185135505-2d795003994a?auto=format&fit=crop&w=800"
                alt="Evento 1"
                className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500"
              />
              <div className="absolute inset-0 bg-black/50 flex items-end p-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Encontro Nacional 2023</h3>
                  <p className="text-gray-300">Maior encontro do ano com mais de 500 motociclistas</p>
                </div>
              </div>
            </div>
            <div className="relative h-80 group overflow-hidden rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1615172282427-9a57ef2d142e?auto=format&fit=crop&w=800"
                alt="Evento 2"
                className="w-full h-full object-cover transform group-hover:scale-110 transition duration-500"
              />
              <div className="absolute inset-0 bg-black/50 flex items-end p-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Ação Solidária</h3>
                  <p className="text-gray-300">Doação de alimentos e brinquedos para instituições carentes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
}