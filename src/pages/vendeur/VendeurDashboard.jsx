import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export default function VendeurDashboard() {
  const { profile } = useAuth()
  const [conges, setConges] = useState([])
  const [annee, setAnnee] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!profile) return
    supabase.from('conges').select('*')
      .eq('vendeur_id', profile.id).eq('annee', annee)
      .then(({ data }) => setConges(data || []))
  }, [profile, annee])

  function getJours(moisIndex) {
    return conges.find(c => c.mois === moisIndex + 1)?.jours_gagnes ?? null
  }

  const total = conges.reduce((s, c) => s + (c.jours_gagnes || 0), 0)
  const moisActuel = new Date().getMonth()

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Bonjour {profile?.full_name?.split(' ')[0] || ''} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Suivi de vos congés</p>
      </div>

      {/* Solde total */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-display font-bold text-gray-900">{total}</p>
            <p className="text-gray-500 text-sm mt-1">jours de congés acquis en {annee}</p>
          </div>
          <select
            value={annee}
            onChange={e => setAnnee(Number(e.target.value))}
            className="input w-28 text-sm"
          >
            {[annee - 1, annee, annee + 1].map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Grille mois */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 text-sm">Détail par mois</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {MOIS.map((mois, i) => {
            const jours = getJours(i)
            const isCurrentMonth = i === moisActuel && annee === new Date().getFullYear()
            return (
              <div
                key={mois}
                className={`rounded-xl p-4 ${isCurrentMonth ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}
              >
                <p className={`text-xs font-medium mb-1 ${isCurrentMonth ? 'text-green-600' : 'text-gray-400'}`}>
                  {mois}
                </p>
                {jours !== null ? (
                  <p className={`text-xl font-display font-bold ${isCurrentMonth ? 'text-green-700' : 'text-gray-900'}`}>
                    {jours}<span className="text-sm font-normal ml-1 text-gray-400">j</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-300">—</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
