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
    <section id="eventos" className="py-20 min-h-dvh">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-12 text-center">Eventos Realizados</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold">Fundação Budegueiros</h3>
              <p className="text-gray-300">Festa de lançamento do clube, realizada no dia 14 de abril de 2024, com a presença de mais de 500 motociclistas</p>
            </div>
            <div className="relative h-80 group overflow-hidden rounded-lg">
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
            <div className="text-center">
              <h3 className="text-2xl font-bold">1° Point Budegueiros</h3>
              <p className="text-yellow-500">No dia 01 de setembro de 2024, foi realizado o primeiro point do clube, com a presença de mais de 100 motociclistas</p>
            </div>
            <div className="relative h-80 group overflow-hidden rounded-lg">
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