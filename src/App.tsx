import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Sobre from './pages/Sobre';  
import Agenda from './pages/Agenda';
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
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-black text-white">
          <Header />
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
      </AuthProvider>
    </Router>
  );
}

export default App;