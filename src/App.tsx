import Header from './components/Header';
import Home from './pages/Home';
import Agenda from './pages/Agenda';
import Eventos from './pages/Eventos';
import Contato from './pages/Contato';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="flex flex-col gap-8">
        <section id="home">
          <Home />
        </section>
        <section id="agenda">
          <Agenda />
        </section>
        <section id="eventos">
          <Eventos />
        </section>
        <section id="contato" className="h-dvh">
          <Contato />
          <Footer />
        </section>
      </div>
    </div>
  );
}

export default App;