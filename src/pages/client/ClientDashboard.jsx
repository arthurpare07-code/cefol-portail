import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [stagiaire, setStagiaire] = useState(null)
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const email = user.email.toLowerCase()
      const { data: s } = await supabase.from('stagiaires').select('*').eq('email', email).single()
      setStagiaire(s)
      const { data: se } = await supabase.from('seances').select('*')
        .eq('stagiaire_email', email).order('date_prevue')
      setSeances(se || [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Chargement...</div>
  if (!stagiaire) return (
    <div className="card p-8 text-center">
      <p className="text-gray-500">Aucun dossier trouve pour {user?.email}</p>
      <p className="text-gray-400 text-sm mt-1">Contactez l'administration CEFOL.</p>
    </div>
  )

  const restant = (stagiaire.heures_commandees || 0) - (stagiaire.heures_realisees || 0)
  const pct = stagiaire.avancement || 0
  const today = new Date().toISOString().slice(0, 10)
  const coursAVenir = seances.filter(s => s.date_prevue >= today)
  const coursPasses = seances.filter(s => s.date_prevue < today)
  const aTEF = stagiaire.tef_note_ce || stagiaire.tef_note_co || stagiaire.tef_note_ee || stagiaire.tef_note_eo

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Bonjour {stagiaire.nom_complet} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Suivi de votre formation</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card p-5 text-center">
          <p className="text-4xl font-display font-bold text-gray-900">{restant}</p>
          <p className="text-gray-500 text-sm mt-1">heures restantes</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-display font-bold text-brand">{stagiaire.heures_realisees || 0}</p>
          <p className="text-gray-500 text-sm mt-1">heures realisees</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-display font-bold text-gray-900">{pct}%</p>
          <p className="text-gray-500 text-sm mt-1">avancement</p>
        </div>
      </div>

      <div className="card p-5 mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-900">Progression</span>
          <span className="text-gray-500">{stagiaire.heures_realisees || 0} / {stagiaire.heures_commandees || 0} h</span>
        </div>
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className="bg-brand h-3 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>

      {aTEF && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Resultats TEF IRN</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Comprehension ecrite', note: stagiaire.tef_note_ce },
              { label: 'Comprehension orale', note: stagiaire.tef_note_co },
              { label: 'Expression ecrite', note: stagiaire.tef_note_ee },
              { label: 'Expression orale', note: stagiaire.tef_note_eo },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-display font-bold text-gray-900">{t.note ?? '-'}</p>
                <p className="text-xs text-gray-400 mt-1">{t.label}</p>
              </div>
            ))}
          </div>
          {stagiaire.tef_objectif && (
            <p className="text-sm text-gray-500 mt-3">Objectif : <span className="font-medium text-gray-900">{stagiaire.tef_objectif}</span></p>
          )}
        </div>
      )}

      <div className="card p-5 mb-5">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm">Cours a venir</h2>
        {coursAVenir.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun cours planifie</p>
        ) : (
          <div className="space-y-2">
            {coursAVenir.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2.5 px-3 bg-brand-light rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.reference}</p>
                  {s.notes && <p className="text-xs text-gray-500">{s.notes}</p>}
                </div>
                <span className="text-sm font-medium text-brand">
                  {s.date_prevue ? new Date(s.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm">Cours realises</h2>
        {coursPasses.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun cours realise pour le moment</p>
        ) : (
          <div className="space-y-2">
            {coursPasses.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.reference}</p>
                  <p className="text-xs text-gray-400">
                    {s.date_prevue ? new Date(s.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </p>
                </div>
                {s.heures_cumulees != null && (
                  <span className="text-sm font-medium text-gray-500">{s.heures_cumulees} h</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
