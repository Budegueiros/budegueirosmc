import { MapPin, Phone, Mail, Users } from 'lucide-react';

export default function Contato() {
    return (
        <section id="contato" className="py-20 bg-zinc-900 h-5/6 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">Entre em Contato</h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="flex items-center gap-4">
                <Phone className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-bold mb-1">Telefone</h3>
                  <p className="text-gray-400">(31) 99350-9922</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-bold mb-1">E-mail</h3>
                  <p className="text-gray-400">budegueirosmc@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-bold mb-1">Endereço</h3>
                  <p className="text-gray-400">Av. Joaquim José Diniz, 790 - Fernão Dias, Belo Horizonte - MG, 31910-520</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Users className="w-8 h-8 text-yellow-500" />
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