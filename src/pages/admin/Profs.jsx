import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, ChevronDown } from 'lucide-react'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function AdminProfs() {
  const [profs, setProfs] = useState([])
  const [selected, setSelected] = useState(null)
  const [cours, setCours] = useState([])
  const [sessions, setSessions] = useState([])
  const [tab, setTab] = useState('cours')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'prof').order('full_name')
      .then(({ data }) => { setProfs(data || []); if (data?.length) setSelected(data[0]) })
  }, [])

  useEffect(() => {
    if (!selected) return
    supabase.from('cours').select('*').eq('prof_id', selected.id).order('jour').then(({ data }) => setCours(data || []))
    supabase.from('sessions_tef').select('*').eq('prof_id', selected.id).order('date', { ascending: true }).then(({ data }) => setSessions(data || []))
  }, [selected])

  async function addCours() {
    setLoading(true)
    await supabase.from('cours').insert({ ...form, prof_id: selected.id })
    const { data } = await supabase.from('cours').select('*').eq('prof_id', selected.id).order('jour')
    setCours(data || [])
    setForm({})
    setShowForm(false)
    setLoading(false)
  }

  async function addSession() {
    setLoading(true)
    await supabase.from('sessions_tef').insert({ ...form, prof_id: selected.id })
    const { data } = await supabase.from('sessions_tef').select('*').eq('prof_id', selected.id).order('date', { ascending: true })
    setSessions(data || [])
    setForm({})
    setShowForm(false)
    setLoading(false)
  }

  async function deleteItem(table, id, setter, list) {
    await supabase.from(table).delete().eq('id', id)
    setter(list.filter(i => i.id !== id))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Profs & planning</h1>
        <p className="text-gray-500 text-sm mt-1">Gérez les cours et sessions TEF de chaque professeur</p>
      </div>

      <div className="flex gap-5">
        {/* Liste profs */}
        <div className="w-48 shrink-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">Professeurs</p>
          <div className="space-y-1">
            {profs.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelected(p); setShowForm(false); setForm({}) }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selected?.id === p.id ? 'bg-brand-light text-brand font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.full_name || p.email}
              </button>
            ))}
          </div>
        </div>

        {/* Détail prof sélectionné */}
        {selected && (
          <div className="flex-1">
            <div className="card overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {['cours', 'tef'].map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setShowForm(false); setForm({}) }}
                    className={`px-5 py-3.5 text-sm font-medium transition-colors ${
                      tab === t ? 'border-b-2 border-brand text-brand' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t === 'cours' ? 'Cours planifiés' : 'Sessions TEF IRN'}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {tab === 'cours' ? (
                  <>
                    <div className="space-y-2 mb-4">
                      {cours.length === 0 && <p className="text-sm text-gray-400">Aucun cours planifié</p>}
                      {cours.map(c => (
                        <div key={c.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded mr-2">{c.jour}</span>
                            <span className="text-sm text-gray-900 font-medium">{c.heure_debut} – {c.heure_fin}</span>
                            <span className="text-sm text-gray-500 ml-2">{c.groupe || ''}</span>
                          </div>
                          <button onClick={() => deleteItem('cours', c.id, setCours, cours)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {showForm ? (
                      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Jour</label>
                            <select className="input" value={form.jour || ''} onChange={e => setForm({ ...form, jour: e.target.value })}>
                              <option value="">— Choisir —</option>
                              {JOURS.map(j => <option key={j}>{j}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Groupe / niveau</label>
                            <input className="input" placeholder="Ex : B2, DELF A2…" value={form.groupe || ''} onChange={e => setForm({ ...form, groupe: e.target.value })} />
                          </div>
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
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Salle / lieu</label>
                          <input className="input" placeholder="Salle 3, visio…" value={form.salle || ''} onChange={e => setForm({ ...form, salle: e.target.value })} />
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-primary text-sm" onClick={addCours} disabled={loading}>Ajouter</button>
                          <button className="btn-secondary text-sm" onClick={() => { setShowForm(false); setForm({}) }}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-mid font-medium">
                        <Plus size={16} /> Ajouter un cours
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {sessions.length === 0 && <p className="text-sm text-gray-400">Aucune session planifiée</p>}
                      {sessions.map(s => (
                        <div key={s.id} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                            {s.heure && <span className="text-sm text-gray-500 ml-2">à {s.heure}</span>}
                            {s.lieu && <span className="text-xs text-gray-400 ml-2">· {s.lieu}</span>}
                          </div>
                          <button onClick={() => deleteItem('sessions_tef', s.id, setSessions, sessions)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {showForm ? (
                      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Date</label>
                            <input type="date" className="input" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Heure</label>
                            <input type="time" className="input" value={form.heure || ''} onChange={e => setForm({ ...form, heure: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Lieu</label>
                          <input className="input" placeholder="Centre d'examen, adresse…" value={form.lieu || ''} onChange={e => setForm({ ...form, lieu: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Remarques</label>
                          <input className="input" placeholder="Nombre de candidats, notes…" value={form.remarques || ''} onChange={e => setForm({ ...form, remarques: e.target.value })} />
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-primary text-sm" onClick={addSession} disabled={loading}>Ajouter</button>
                          <button className="btn-secondary text-sm" onClick={() => { setShowForm(false); setForm({}) }}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-mid font-medium">
                        <Plus size={16} /> Ajouter une session TEF
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
