import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function Eventos() {
  const fundacaoImages = [
    '/Fundacao.jpg',
    '/Fundacao2.jpg',
    '/Fundacao3.jpg',
    '/Fundacao4.jpg',
    '/Fundacao5.jpg',
    '/Fundacao6.jpg',
    '/Fundacao7.jpg'
  ];

  const pointImagens = [
    '/Point.jpeg',
    '/Point1.jpeg',
    '/Point3.jpeg',
    '/Point4.jpeg'
  ];

  return (
    <section className="relative py-12 md:py-20 min-h-screen pt-24 bg-black overflow-hidden">
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
        <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center font-oswald">Eventos Realizados</h2>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="text-center px-4">
              <h3 className="text-xl md:text-2xl font-bold mb-2">Fundação Budegueiros</h3>
              <p className="text-gray-300 text-sm md:text-base">
                Festa de lançamento do clube, realizada no dia 14 de abril de 2024, 
                com a presença de mais de 500 motociclistas
              </p>
            </div>
            <div className="relative h-64 md:h-80 group overflow-hidden rounded-lg">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                className="h-full w-full"
              >
                {fundacaoImages.map((img, index) => (
                  <SwiperSlide key={index}>
                    <img
                      src={img}
                      alt={`Fundação Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-center px-4">
              <h3 className="text-xl md:text-2xl font-bold mb-2">1° Point Budegueiros</h3>
              <p className="text-brand-red text-sm md:text-base">
                No dia 01 de setembro de 2024, foi realizado o primeiro point do clube, 
                com a presença de mais de 100 motociclistas
              </p>
            </div>
            <div className="relative h-64 md:h-80 group overflow-hidden rounded-lg">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                className="h-full w-full"
              >
                {pointImagens.map((img, index) => (
                  <SwiperSlide key={index}>
                    <img
                      src={img}
                      alt={`Point Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}