import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProfs from './pages/admin/Profs'
import AdminVendeurs from './pages/admin/Vendeurs'
import AdminClients from './pages/admin/Clients'
import AdminImport from './pages/admin/Import'
import ProfDashboard from './pages/prof/ProfDashboard'
import VendeurDashboard from './pages/vendeur/VendeurDashboard'
import ClientDashboard from './pages/client/ClientDashboard'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
          <span className="text-white font-display font-bold">C</span>
        </div>
        <p className="text-gray-400 text-sm">Chargement…</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RoleRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return null
  const role = profile?.role
  if (role === 'admin') return <Navigate to="/admin" replace />
  if (role === 'prof') return <Navigate to="/prof" replace />
  if (role === 'vendeur') return <Navigate to="/vendeur" replace />
  return <Navigate to="/client" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><RoleRedirect /></RequireAuth>} />

          {/* Admin */}
          <Route path="/admin" element={<RequireAuth><Layout><AdminDashboard /></Layout></RequireAuth>} />
          <Route path="/admin/profs" element={<RequireAuth><Layout><AdminProfs /></Layout></RequireAuth>} />
          <Route path="/admin/vendeurs" element={<RequireAuth><Layout><AdminVendeurs /></Layout></RequireAuth>} />
          <Route path="/admin/clients" element={<RequireAuth><Layout><AdminClients /></Layout></RequireAuth>} />
          <Route path="/admin/import" element={<RequireAuth><Layout><AdminImport /></Layout></RequireAuth>} />

          {/* Prof */}
          <Route path="/prof" element={<RequireAuth><Layout><ProfDashboard /></Layout></RequireAuth>} />

          {/* Vendeur */}
          <Route path="/vendeur" element={<RequireAuth><Layout><VendeurDashboard /></Layout></RequireAuth>} />

          {/* Client */}
          <Route path="/client" element={<RequireAuth><Layout><ClientDashboard /></Layout></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
