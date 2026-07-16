import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Users, BookOpen, Clock, Calendar } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ profs: 0, vendeurs: 0, clients: 0, sessionsAVenir: 0 })

  useEffect(() => {
    async function loadStats() {
      const [{ count: profs }, { count: vendeurs }, { count: clients }, { count: sessions }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'prof'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vendeur'),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('sessions_tef').select('*', { count: 'exact', head: true }).gte('date', new Date().toISOString()),
      ])
      setStats({ profs: profs || 0, vendeurs: vendeurs || 0, clients: clients || 0, sessionsAVenir: sessions || 0 })
    }
    loadStats()
  }, [])

  const cards = [
    { label: 'Professeurs', value: stats.profs, icon: BookOpen, color: 'text-blue-600 bg-blue-50', action: () => navigate('/admin/profs') },
    { label: 'Vendeurs', value: stats.vendeurs, icon: Users, color: 'text-green-600 bg-green-50', action: () => navigate('/admin/vendeurs') },
    { label: 'Clients actifs', value: stats.clients, icon: Clock, color: 'text-amber-600 bg-amber-50', action: () => navigate('/admin/clients') },
    { label: 'Sessions TEF à venir', value: stats.sessionsAVenir, icon: Calendar, color: 'text-purple-600 bg-purple-50', action: () => navigate('/admin/profs') },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble du portail CEFOL</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, action }) => (
          <button
            key={label}
            onClick={action}
            className="card p-5 text-left hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-3xl font-display font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Actions rapides</h2>
          <div className="space-y-2">
            <button onClick={() => navigate('/admin/import')} className="btn-primary w-full text-sm">
              Importer un fichier Excel
            </button>
            <button onClick={() => navigate('/admin/vendeurs')} className="btn-secondary w-full text-sm">
              Saisir les congés du mois
            </button>
            <button onClick={() => navigate('/admin/clients')} className="btn-secondary w-full text-sm">
              Envoyer des liens clients
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Prochaines sessions TEF IRN</h2>
          <SessionsPreview />
        </div>
      </div>
    </div>
  )
}

function SessionsPreview() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    supabase
      .from('sessions_tef')
      .select('*, profiles(full_name)')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(4)
      .then(({ data }) => setSessions(data || []))
  }, [])

  if (!sessions.length) return <p className="text-sm text-gray-400">Aucune session planifiée</p>

  return (
    <div className="space-y-2">
      {sessions.map(s => (
        <div key={s.id} className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium text-gray-900">{s.profiles?.full_name || '—'}</p>
            <p className="text-xs text-gray-400">{s.lieu || 'Lieu non précisé'}</p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {new Date(s.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      ))}
    </div>
  )
}
