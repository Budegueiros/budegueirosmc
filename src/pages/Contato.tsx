import { MapPin, Phone, Mail, Users, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Contato() {
    return (
        <section className="relative py-20 bg-zinc-900 min-h-screen flex items-center justify-center pt-24 overflow-hidden">
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
          <h2 className="text-4xl font-bold mb-12 text-center font-oswald">Entre em Contato</h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="flex items-center gap-4">
                <Phone className="w-8 h-8 text-brand-red" />
                <div>
                  <h3 className="font-bold mb-1">Telefone</h3>
                  <p className="text-gray-400">(31) 99350-9922</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="w-8 h-8 text-brand-red" />
                <div>
                  <h3 className="font-bold mb-1">E-mail</h3>
                  <p className="text-gray-400">budegueirosmc@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="w-8 h-8 text-brand-red" />
                <div>
                  <h3 className="font-bold mb-1">Endereço</h3>
                  <p className="text-gray-400">Av. Joaquim José Diniz, 790 - Fernão Dias, Belo Horizonte - MG, 31910-520</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Users className="w-8 h-8 text-brand-red" />
                <div>
                  <h3 className="font-bold mb-1">Reuniões</h3>
                  <p className="text-gray-400">1º domingo de cada mês</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
}