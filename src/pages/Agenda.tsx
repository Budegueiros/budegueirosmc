import Header from '../components/Header';
import AgendaContent from '../components/AgendaContent';

export default function Agenda() {
  return (
    <>
      <Header />
      <AgendaContent isLoggedIn={false} />
    </>
  );
}