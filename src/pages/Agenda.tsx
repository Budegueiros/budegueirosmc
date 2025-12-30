import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import AgendaContent from '../components/AgendaContent';

export default function Agenda() {
  return (
    <>
      <Header />
      <Sidebar />
      <AgendaContent isLoggedIn={false} />
    </>
  );
}