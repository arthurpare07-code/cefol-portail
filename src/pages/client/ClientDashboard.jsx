import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [heures, setHeures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: c } = await supabase.from('clients').select('*').eq('email', user.email).single()
      setClient(c)
      if (c) {
        const { data: h } = await supabase.from('heures_client').select('*')
          .eq('client_id', c.id).order('date', { ascending: false })
        setHeures(h || [])
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement…</div>
  if (!client) return (
    <div className="card p-8 text-center">
      <p className="text-gray-500">Aucun dossier trouvé pour {user?.email}</p>
      <p className="text-gray-400 text-sm mt-1">Contactez l'administration CEFOL.</p>
    </div>
  )

  const consomme = heures.reduce((s, h) => s + (h.heures_utilisees || 0), 0)
  const restant = (client.heures_achetees || 0) - consomme
  const pct = client.heures_achetees ? Math.round((consomme / client.heures_achetees) * 100) : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Bonjour {client.nom} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Suivi de vos heures de formation</p>
      </div>

      {/* Compteur principal */}
      <div className="card p-8 mb-5 text-center">
        <p className="text-7xl font-display font-bold text-gray-900">{restant}</p>
        <p className="text-gray-500 mt-2">heures restantes</p>

        <div className="mt-6 bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-brand h-3 rounded-full transition-all"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{consomme} h utilisées</span>
          <span>{client.heures_achetees} h achetées</span>
        </div>
      </div>

      {/* Historique des séances */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 text-sm">Historique de vos séances</h2>
        {heures.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune séance enregistrée pour le moment</p>
        ) : (
          <div className="space-y-2">
            {heures.map(h => (
              <div key={h.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{h.description || 'Séance'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-sm font-medium text-brand bg-brand-light px-2.5 py-1 rounded-full">
                  {h.heures_utilisees || h.heures} h
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
