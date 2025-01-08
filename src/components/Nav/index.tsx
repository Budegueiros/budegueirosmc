import {
    House,
    CalendarDays,
    BookImage,
    MailPlus,
    Instagram,
  } from "lucide-react";

function Nav() {
    return ( 
        <div className="w-screen flex-wrap flex justify-end">
          {/* <!-- Menu Flutuante em Colunas --> */}
          <div className="absolute h-full  w-3/6 text-right bg-slate-900 shadow-lg rounded-lg p-4 md:hidden">
            <div className="flex flex-col gap-6 text-4xl font-sans text-gray-50 text-center">
              <a href="/" className="gap-1 items-center hover:text-blue-500">
                <House size={36} /> Home
              </a>
              <a
                href="/eventos"
                className="gap-1 items-center hover:text-blue-500"
              >
                <CalendarDays size={36} /> Eventos
              </a>
              <a
                href="/galeria"
                className="gap-1 items-center hover:text-blue-500"
              >
                <BookImage size={36} /> Galeria
              </a>
              <a
                href="/contato"
                className="gap-1 items-center hover:text-blue-500"
              >
                <MailPlus size={36} /> Contato
              </a>

              <a
                rel="me nofollow noopener noreferrer"
                href="https://www.instagram.com/budegueirosmc/"
                className="text-[#c4170c] justify-center hover:text-blue-500"
              >
                <Instagram size={48} />
              </a>
            </div>
          </div>
        </div>
     );
}

export default Nav;