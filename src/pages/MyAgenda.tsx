import DashboardLayout from '../components/DashboardLayout';
import AgendaContent from '../components/AgendaContent';

export default function MyAgenda() {
  return (
    <DashboardLayout>
      <AgendaContent isLoggedIn={true} />
    </DashboardLayout>
  );
}
