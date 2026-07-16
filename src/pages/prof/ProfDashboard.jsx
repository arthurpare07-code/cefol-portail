import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Calendar, FileText } from 'lucide-react'

const JOURS_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function ProfDashboard() {
  const { profile } = useAuth()
  const [cours, setCours] = useState([])
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    if (!profile) return
    supabase.from('cours').select('*').eq('prof_id', profile.id)
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) => JOURS_ORDER.indexOf(a.jour) - JOURS_ORDER.indexOf(b.jour))
        setCours(sorted)
      })
    supabase.from('sessions_tef').select('*').eq('prof_id', profile.id)
      .gte('date', new Date().toISOString()).order('date', { ascending: true })
      .then(({ data }) => setSessions(data || []))
  }, [profile])

  const jourActuel = new Date().toLocaleDateString('fr-FR', { weekday: 'long' })
  const jourCapitalized = jourActuel.charAt(0).toUpperCase() + jourActuel.slice(1)
  const coursAujourdhui = cours.filter(c => c.jour === jourCapitalized)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Bonjour {profile?.full_name?.split(' ')[0] || ''} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Cours d'aujourd'hui */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-brand" />
            <h2 className="font-semibold text-gray-900 text-sm">Aujourd'hui</h2>
          </div>
          {coursAujourdhui.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm">Pas de cours aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {coursAujourdhui.map(c => (
                <div key={c.id} className="bg-brand-light rounded-lg px-4 py-3">
                  <p className="font-medium text-brand text-sm">{c.heure_debut} – {c.heure_fin}</p>
                  <p className="text-gray-700 text-sm">{c.groupe || 'Cours'}</p>
                  {c.salle && <p className="text-xs text-gray-400 mt-0.5">{c.salle}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prochaine session TEF */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-purple-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Prochaine session TEF IRN</h2>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm">Aucune session planifiée</p>
            </div>
          ) : (
            <div className="bg-purple-50 rounded-lg px-4 py-4">
              <p className="font-semibold text-purple-900 text-base capitalize">
                {new Date(sessions[0].date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {sessions[0].heure && <p className="text-purple-700 text-sm mt-0.5">à {sessions[0].heure}</p>}
              {sessions[0].lieu && <p className="text-purple-600 text-xs mt-1">{sessions[0].lieu}</p>}
              {sessions[0].remarques && <p className="text-gray-500 text-xs mt-2 italic">{sessions[0].remarques}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Planning complet de la semaine */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 text-sm">Mon planning hebdomadaire</h2>
        {cours.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun cours dans votre planning</p>
        ) : (
          <div className="space-y-1">
            {JOURS_ORDER.map(jour => {
              const coursDuJour = cours.filter(c => c.jour === jour)
              if (!coursDuJour.length) return null
              return (
                <div key={jour} className={`flex gap-4 py-2.5 px-3 rounded-lg ${jour === jourCapitalized ? 'bg-brand-light' : ''}`}>
                  <span className={`text-sm font-medium w-20 shrink-0 ${jour === jourCapitalized ? 'text-brand' : 'text-gray-500'}`}>
                    {jour}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {coursDuJour.map(c => (
                      <span key={c.id} className="text-sm text-gray-700">
                        {c.heure_debut}–{c.heure_fin}
                        {c.groupe && <span className="text-gray-400 ml-1">({c.groupe})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
