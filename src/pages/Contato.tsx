import { useState } from 'react';
import { MapPin, Phone, Mail, Users, MessageSquare, Send, ExternalLink, Instagram, Twitter } from 'lucide-react';
export default function Contato() {
  const [subject, setSubject] = useState('Sugestão');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de envio
    setTimeout(() => {
      setSent(true);
      setMessage('');
    }, 1000);
  };

  const contactInfo = [
    {
      icon: <Phone size={24} className="text-brand-red" />,
      title: 'Telefone / WhatsApp',
      value: '(31) 99350-9922',
      link: 'https://wa.me/5531993509922',
      action: 'Chamar no WhatsApp'
    },
    {
      icon: <Mail size={24} className="text-brand-red" />,
      title: 'E-mail Oficial',
      value: 'budegueirosmc@gmail.com',
      link: 'mailto:budegueirosmc@gmail.com',
      action: 'Enviar e-mail'
    },
    {
      icon: <MapPin size={24} className="text-brand-red" />,
      title: 'Ponto de Encontro Principal',
      value: 'Av. Joaquim José Diniz, 790',
      subValue: 'Fernão Dias, Belo Horizonte - MG, 31910-520',
      link: 'https://maps.google.com/?q=Av.+Joaquim+José+Diniz,+790+-+Fernão+Dias,+Belo+Horizonte+-+MG',
      action: 'Ver no Google Maps'
    },
    {
      icon: <Users size={24} className="text-brand-red" />,
      title: 'Reuniões Mensais',
      value: '1º domingo de cada mês',
      subValue: 'Horário: 11:00 (confirmar presença)',
      link: null,
      action: null
    }
  ];

  return (
    <section className="relative py-20 bg-black min-h-screen flex items-center justify-center pt-24 overflow-hidden">

      <div className="container mx-auto px-4 pl-16 md:pl-24 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3 font-oswald uppercase">
              <MessageSquare className="text-brand-red w-8 h-8 md:w-10 md:h-10" /> 
              Canais de Comunicação
            </h2>
            <p className="text-gray-400 text-sm md:text-base mt-2">
              Fale com a diretoria ou consulte os dados oficiais do clube.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactInfo.map((info, idx) => (
              <div
                key={idx}
                className="bg-zinc-900 border border-gray-800 p-6 rounded-lg hover:border-brand-red/50 transition-all group"
              >
                <div className="bg-black w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-gray-800 group-hover:border-brand-red/30 transition-colors">
                  {info.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2 font-oswald uppercase">{info.title}</h3>
                <p className="text-gray-300 font-medium">{info.value}</p>
                {info.subValue && <p className="text-gray-500 text-sm mt-1">{info.subValue}</p>}

                {info.link && (
                  <a
                    href={info.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-brand-red mt-4 hover:text-red-400 uppercase tracking-wide transition"
                  >
                    {info.action} <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}

            {/* Social Media Card */}
            <div className="md:col-span-2 bg-gradient-to-r from-zinc-900 to-zinc-800 border border-gray-800 p-6 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-6 hover:border-brand-red/30 transition-all">
              <div>
                <h3 className="text-white font-bold text-lg font-oswald uppercase">Redes Sociais</h3>
                <p className="text-gray-400 text-sm">Siga o Budegueiros MC nas redes</p>
              </div>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/budegueirosmc/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 transition-all border border-gray-800 hover:border-transparent"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="https://x.com/BudegueirosMC"
                  target="_blank"
                  rel="noreferrer"
                  className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-sky-500 transition-all border border-gray-800 hover:border-transparent"
                >
                  <Twitter size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-zinc-900 border border-gray-800 p-6 rounded-lg h-fit lg:sticky lg:top-24">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-3 font-oswald uppercase">
              Mensagem Direta
            </h3>

            {sent ? (
              <div className="bg-green-900/20 border border-green-900 text-green-400 p-6 rounded-lg text-center py-12">
                <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={32} />
                </div>
                <h4 className="font-bold text-lg">Mensagem Enviada!</h4>
                <p className="text-sm mt-2 opacity-80">A diretoria responderá em breve.</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-xs text-green-300 hover:text-white underline transition"
                >
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-400 mb-6">
                  Envie dúvidas, sugestões ou solicitações diretamente para a administração do clube.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assunto
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-red transition"
                  >
                    <option value="Sugestão">Sugestão / Ideia</option>
                    <option value="Dúvida">Dúvida Geral</option>
                    <option value="Financeiro">Tesouraria / Financeiro</option>
                    <option value="Eventos">Eventos / Viagens</option>
                    <option value="Outros">Outros Assuntos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Escreva sua mensagem aqui..."
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-red transition min-h-[150px] resize-none"
                  />
                </div>

                <div className="bg-black p-3 rounded-lg text-xs text-gray-500 border border-gray-800">
                  Sua mensagem será enviada para a diretoria do clube.
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-oswald uppercase"
                >
                  <Send size={18} /> Enviar Mensagem
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}