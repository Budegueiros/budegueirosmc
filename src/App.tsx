import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/Header';
import Home from './pages/Home';
import Sobre from './pages/Sobre';  
import Agenda from './pages/Agenda';
import MyAgenda from './pages/MyAgenda';
import Eventos from './pages/Eventos';
import Contato from './pages/Contato';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AcceptInvite from './pages/AcceptInvite';
import CompleteProfile from './pages/CompleteProfile';
import InviteMember from './pages/InviteMember';
import ManageMembers from './pages/ManageMembers';
import EditProfile from './pages/EditProfile';
import CreateEvent from './pages/CreateEvent';
import ManageEvents from './pages/ManageEvents';
import ManagePayments from './pages/ManagePayments';
import MyPayments from './pages/MyPayments';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import EditMoto from './pages/EditMoto';
import AddMoto from './pages/AddMoto';
import FamilyMembers from './pages/FamilyMembers';
import Polls from './pages/Polls';
import CreatePoll from './pages/CreatePoll';
import Comunicados from './pages/Comunicados';
import ManageComunicados from './pages/ManageComunicados';
import ManageCargos from './pages/ManageCargos';
import ManagePolls from './pages/ManagePolls';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

function AppContent() {
  const location = useLocation();
  
  // Rotas que não devem mostrar o header padrão (área de membros)
  const hideHeaderRoutes = [
    '/dashboard',
    '/complete-profile',
    '/edit-profile',
    '/invite-member',
    '/manage-members',
    '/manage-events',
    '/manage-payments',
    '/my-payments',
    '/my-agenda',
    '/create-event',
    '/admin',
    '/edit-moto',
    '/add-moto',
    '/family-members',
    '/polls',
    '/create-poll',
    '/comunicados',
    '/manage-comunicados',
    '/manage-cargos',
    '/manage-polls'
  ];
  
  const shouldHideHeader = hideHeaderRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="min-h-screen bg-black text-white">
      {!shouldHideHeader && <Header />}
      <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route 
                path="/complete-profile" 
                element={
                  <ProtectedRoute>
                    <CompleteProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/invite-member" 
                element={
                  <ProtectedRoute>
                    <InviteMember />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage-members" 
                element={
                  <ProtectedRoute>
                    <ManageMembers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/edit-profile" 
                element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-event" 
                element={
                  <ProtectedRoute>
                    <CreateEvent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage-events" 
                element={
                  <ProtectedRoute>
                    <ManageEvents />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage-payments" 
                element={
                  <ProtectedRoute>
                    <ManagePayments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-payments" 
                element={
                  <ProtectedRoute>
                    <MyPayments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/edit-moto/:id" 
                element={
                  <ProtectedRoute>
                    <EditMoto />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/add-moto" 
                element={
                  <ProtectedRoute>
                    <AddMoto />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/family-members" 
                element={
                  <ProtectedRoute>
                    <FamilyMembers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/polls" 
                element={
                  <ProtectedRoute>
                    <Polls />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-poll" 
                element={
                  <ProtectedRoute>
                    <CreatePoll />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/comunicados" 
                element={
                  <ProtectedRoute>
                    <Comunicados />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage-comunicados" 
                element={
                  <ProtectedRoute>
                    <ManageComunicados />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage-cargos" 
                element={
                  <ProtectedRoute>
                    <ManageCargos />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage-polls" 
                element={
                  <ProtectedRoute>
                    <ManagePolls />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-agenda" 
                element={
                  <ProtectedRoute>
                    <MyAgenda />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;