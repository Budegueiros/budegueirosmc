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
      <Home />
      <Agenda />
      <Eventos />
      <div className="h-dvh">
        <Contato />
        <Footer />
      </div>

    </div>
  );
}

export default App;