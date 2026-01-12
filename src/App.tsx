import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Lazy load de páginas públicas (carregadas imediatamente)
const Home = lazy(() => import('./pages/Home'));
const Sobre = lazy(() => import('./pages/Sobre'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Eventos = lazy(() => import('./pages/Eventos'));
const Contato = lazy(() => import('./pages/Contato'));

// Lazy load de páginas de autenticação
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));

// Lazy load de páginas protegidas (carregadas sob demanda)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const MyAgenda = lazy(() => import('./pages/MyAgenda'));
const MyPayments = lazy(() => import('./pages/MyPayments'));

// Lazy load de páginas administrativas (carregadas sob demanda)
const Admin = lazy(() => import('./pages/Admin'));
const ManageMembers = lazy(() => import('./pages/ManageMembers'));
const ManageMemberDetail = lazy(() => import('./pages/ManageMemberDetail'));
const InviteMember = lazy(() => import('./pages/InviteMember'));
const ManageEvents = lazy(() => import('./pages/ManageEvents'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const ManagePayments = lazy(() => import('./pages/ManagePayments'));
const ManageCargos = lazy(() => import('./pages/ManageCargos'));
const ManageComunicados = lazy(() => import('./pages/ManageComunicados'));
const ManagePolls = lazy(() => import('./pages/ManagePolls'));
const ManageDocumentos = lazy(() => import('./pages/ManageDocumentos'));
const ManageCategoriasCaixa = lazy(() => import('./pages/ManageCategoriasCaixa'));
const ControleCaixa = lazy(() => import('./pages/ControleCaixa'));

// Lazy load de páginas de membros
const AddMoto = lazy(() => import('./pages/AddMoto'));
const EditMoto = lazy(() => import('./pages/EditMoto'));
const FamilyMembers = lazy(() => import('./pages/FamilyMembers'));
const Polls = lazy(() => import('./pages/Polls'));
const CreatePoll = lazy(() => import('./pages/CreatePoll'));
const Comunicados = lazy(() => import('./pages/Comunicados'));
const Documentos = lazy(() => import('./pages/Documentos'));

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
    '/manage-polls',
    '/documentos',
    '/manage-documentos',
    '/controle-caixa'
  ];
  
  const shouldHideHeader = hideHeaderRoutes.some(route => 
    location.pathname.startsWith(route) || location.pathname.match(/^\/manage-members\/[^/]+$/)
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {!shouldHideHeader && <Header />}
      <main>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/contato" element={<Contato />} />
            
            {/* Rotas de autenticação */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            
            {/* Rotas protegidas - Dashboard e perfil */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
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
              path="/my-agenda"
              element={
                <ProtectedRoute>
                  <MyAgenda />
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
            
            {/* Rotas protegidas - Membros */}
            <Route
              path="/add-moto"
              element={
                <ProtectedRoute>
                  <AddMoto />
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
              path="/documentos"
              element={
                <ProtectedRoute>
                  <Documentos />
                </ProtectedRoute>
              }
            />
            
            {/* Rotas protegidas - Administração */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
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
              path="/manage-members/:id"
              element={
                <ProtectedRoute>
                  <ManageMemberDetail />
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
              path="/manage-cargos"
              element={
                <ProtectedRoute>
                  <ManageCargos />
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
              path="/manage-polls"
              element={
                <ProtectedRoute>
                  <ManagePolls />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-documentos"
              element={
                <ProtectedRoute>
                  <ManageDocumentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-categorias-caixa"
              element={
                <ProtectedRoute>
                  <ManageCategoriasCaixa />
                </ProtectedRoute>
              }
            />
            <Route
              path="/controle-caixa"
              element={
                <ProtectedRoute>
                  <ControleCaixa />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
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