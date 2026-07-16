import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const COULEURS = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  red: 'bg-red-100 text-red-700 border-red-200',
}

function lundiDeLaSemaine(date) {
  const d = new Date(date)
  const jour = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - jour)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

export default function Agenda({ userId, canEdit = false }) {
  const [vue, setVue] = useState('semaine')
  const [curseur, setCurseur] = useState(new Date())
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ couleur: 'blue' })
  const [loading, setLoading] = useState(false)

  async function chargerEvents() {
    if (!userId) return
    const { data } = await supabase.from('agenda').select('*').eq('user_id', userId).order('date')
    setEvents(data || [])
  }

  useEffect(() => { chargerEvents() }, [userId])

  function eventsDuJour(dateStr) {
    return events
      .filter(e => e.date === dateStr)
      .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))
  }

  async function ajouterEvent() {
    if (!form.titre || !form.date) return
    setLoading(true)
    await supabase.from('agenda').insert({ ...form, user_id: userId })
    await chargerEvents()
    setForm({ couleur: 'blue' })
    setShowForm(false)
    setLoading(false)
  }

  async function supprimerEvent(id) {
    await supabase.from('agenda').delete().eq('id', id)
    setEvents(events.filter(e => e.id !== id))
  }

  function ouvrirFormPour(dateStr) {
    if (!canEdit) return
    setForm({ couleur: 'blue', date: dateStr })
    setShowForm(true)
  }

  function precedent() {
    const d = new Date(curseur)
    if (vue === 'semaine') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setCurseur(d)
  }
  function suivant() {
    const d = new Date(curseur)
    if (vue === 'semaine') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setCurseur(d)
  }

  const todayStr = toISODate(new Date())

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={precedent} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurseur(new Date())} className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium">
            Aujourd'hui
          </button>
          <button onClick={suivant} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ChevronRight size={16} />
          </button>
          <span className="text-base font-semibold text-gray-900 ml-2">
            {vue === 'semaine'
              ? `Semaine du ${lundiDeLaSemaine(curseur).getDate()} ${MOIS[lundiDeLaSemaine(curseur).getMonth()]}`
              : `${MOIS[curseur.getMonth()]} ${curseur.getFullYear()}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setVue('semaine')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${vue === 'semaine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Semaine
            </button>
            <button
              onClick={() => setVue('mois')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${vue === 'mois' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Mois
            </button>
          </div>
          {canEdit && (
            <button onClick={() => ouvrirFormPour(todayStr)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus size={15} /> Événement
            </button>
          )}
        </div>
      </div>

      {vue === 'semaine' && (
        <VueSemaine curseur={curseur} eventsDuJour={eventsDuJour} todayStr={todayStr} canEdit={canEdit} onAjouter={ouvrirFormPour} onSupprimer={supprimerEvent} />
      )}
      {vue === 'mois' && (
        <VueMois curseur={curseur} eventsDuJour={eventsDuJour} todayStr={todayStr} canEdit={canEdit} onAjouter={ouvrirFormPour} />
      )}

      {showForm && canEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Nouvel événement</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Titre</label>
                <input className="input" placeholder="Ex : Cours B2, Session TEF…" value={form.titre || ''} onChange={e => setForm({ ...form, titre: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Date</label>
                <input type="date" className="input" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Heure début</label>
                  <input type="time" className="input" value={form.heure_debut || ''} onChange={e => setForm({ ...form, heure_debut: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Heure fin</label>
                  <input type="time" className="input" value={form.heure_fin || ''} onChange={e => setForm({ ...form, heure_fin: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Description (optionnel)</label>
                <input className="input" placeholder="Salle, notes…" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Couleur</label>
                <div className="flex gap-2">
                  {Object.keys(COULEURS).map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, couleur: c })}
                      className={`w-8 h-8 rounded-lg border-2 ${COULEURS[c].split(' ')[0]} ${form.couleur === c ? 'border-gray-900' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="btn-primary text-sm" onClick={ajouterEvent} disabled={loading}>
                  {loading ? 'Ajout…' : 'Ajouter'}
                </button>
                <button className="btn-secondary text-sm" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VueSemaine({ curseur, eventsDuJour, todayStr, canEdit, onAjouter, onSupprimer }) {
  const lundi = lundiDeLaSemaine(curseur)
  const jours = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundi)
    d.setDate(lundi.getDate() + i)
    return d
  })

  return (
    <div className="grid grid-cols-7 gap-2">
      {jours.map((d, i) => {
        const dateStr = toISODate(d)
        const isToday = dateStr === todayStr
        const evs = eventsDuJour(dateStr)
        return (
          <div key={i} className={`card p-2 min-h-40 ${isToday ? 'ring-2 ring-brand' : ''}`}>
            <div className="text-center mb-2">
              <p className="text-xs text-gray-400">{JOURS[i]}</p>
              <p className={`text-lg font-semibold ${isToday ? 'text-brand' : 'text-gray-900'}`}>{d.getDate()}</p>
            </div>
            <div className="space-y-1.5">
              {evs.map(e => (
                <div key={e.id} className={`text-xs rounded-md border px-2 py-1.5 ${COULEURS[e.couleur] || COULEURS.blue} group relative`}>
                  {e.heure_debut && <p className="font-medium">{e.heure_debut.slice(0, 5)}</p>}
                  <p className="leading-tight">{e.titre}</p>
                  {canEdit && (
                    <button onClick={() => onSupprimer(e.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-current">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              {canEdit && (
                <button onClick={() => onAjouter(dateStr)} className="w-full text-xs text-gray-300 hover:text-brand py-1">
                  + ajouter
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VueMois({ curseur, eventsDuJour, todayStr, canEdit, onAjouter }) {
  const annee = curseur.getFullYear()
  const mois = curseur.getMonth()
  const premierDuMois = new Date(annee, mois, 1)
  const debut = lundiDeLaSemaine(premierDuMois)

  const jours = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(debut)
    d.setDate(debut.getDate() + i)
    return d
  })

  return (
    <div className="card p-3">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {JOURS.map(j => (
          <div key={j} className="text-center text-xs font-medium text-gray-400 py-1">{j}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {jours.map((d, i) => {
          const dateStr = toISODate(d)
          const isToday = dateStr === todayStr
          const inMonth = d.getMonth() === mois
          const evs = eventsDuJour(dateStr)
          return (
            <div
              key={i}
              onClick={() => canEdit && onAjouter(dateStr)}
              className={`min-h-20 rounded-lg p-1.5 border ${isToday ? 'border-brand bg-brand-light' : 'border-gray-100'} ${inMonth ? '' : 'opacity-40'} ${canEdit ? 'cursor-pointer hover:border-gray-300' : ''}`}
            >
              <p className={`text-xs font-medium mb-1 ${isToday ? 'text-brand' : 'text-gray-700'}`}>{d.getDate()}</p>
              <div className="space-y-0.5">
                {evs.slice(0, 3).map(e => (
                  <div key={e.id} className={`text-xs rounded px-1 py-0.5 truncate ${COULEURS[e.couleur] || COULEURS.blue}`}>
                    {e.heure_debut ? e.heure_debut.slice(0, 5) + ' ' : ''}{e.titre}
                  </div>
                ))}
                {evs.length > 3 && <p className="text-xs text-gray-400 px-1">+{evs.length - 3}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
