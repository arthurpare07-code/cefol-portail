import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Calendar, Users, Upload, LogOut, BookOpen, ClipboardList
} from 'lucide-react'

const navByRole = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/admin/profs', icon: BookOpen, label: 'Profs & planning' },
    { to: '/admin/vendeurs', icon: Users, label: 'Vendeurs & congés' },
    { to: '/admin/clients', icon: ClipboardList, label: 'Clients & heures' },
    { to: '/admin/agendas', icon: Calendar, label: 'Agendas' },
    { to: '/admin/import', icon: Upload, label: 'Importer Excel' },
  ],
  prof: [
    { to: '/prof', icon: LayoutDashboard, label: 'Mon planning' },
    { to: '/prof/agenda', icon: Calendar, label: 'Mon agenda' },
  ],
  vendeur: [
    { to: '/vendeur', icon: LayoutDashboard, label: 'Mon espace' },
    { to: '/vendeur/agenda', icon: Calendar, label: 'Mon agenda' },
  ],
  client: [
    { to: '/client', icon: LayoutDashboard, label: 'Mon suivi' },
  ],
}

const roleLabel = {
  admin: { label: 'Administration', className: 'badge-admin' },
  prof: { label: 'Professeur', className: 'badge-prof' },
  vendeur: { label: 'Vendeur', className: 'badge-vendeur' },
  client: { label: 'Client', className: 'badge-client' },
}

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const role = profile?.role || 'client'
  const nav = navByRole[role] || navByRole.client
  const roleMeta = roleLabel[role] || roleLabel.client

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="w-60 bg-card border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-display font-bold text-base">C</span>
            </div>
            <div>
              <p className="font-display font-semibold text-gray-900 text-sm leading-tight">CEFOL</p>
              <p className="text-xs text-gray-400 leading-tight">Portail</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-light text-brand'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.full_name || profile?.email || 'Utilisateur'}
            </p>
            <span className={`${roleMeta.className} mt-1`}>{roleMeta.label}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
