import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Send, Trash2 } from 'lucide-react'

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState(null)
  const [heures, setHeures] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nom: '', email: '', heures_achetees: 0 })
  const [debit, setDebit] = useState({ description: '', heures: 0, date: new Date().toISOString().slice(0, 10) })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('*').order('nom')
      .then(({ data }) => { setClients(data || []); if (data?.length) setSelected(data[0]) })
  }, [])

  useEffect(() => {
    if (!selected) return
    supabase.from('heures_client').select('*').eq('client_id', selected.id).order('date', { ascending: false })
      .then(({ data }) => setHeures(data || []))
  }, [selected])

  const solde = selected
    ? (selected.heures_achetees || 0) - heures.reduce((s, h) => s + (h.heures_utilisees || 0), 0)
    : 0

  async function addClient() {
    setLoading(true)
    const { data } = await supabase.from('clients').insert(form).select().single()
    if (data) { setClients([...clients, data]); setSelected(data) }
    setForm({ nom: '', email: '', heures_achetees: 0 })
    setShowAdd(false)
    setLoading(false)
  }

  async function addDebit() {
    setLoading(true)
    await supabase.from('heures_client').insert({ ...debit, client_id: selected.id })
    const { data } = await supabase.from('heures_client').select('*').eq('client_id', selected.id).order('date', { ascending: false })
    setHeures(data || [])
    setDebit({ description: '', heures: 0, date: new Date().toISOString().slice(0, 10) })
    setLoading(false)
  }

  async function sendMagicLink() {
    if (!selected?.email) return
    setSending(true)
    await supabase.auth.signInWithOtp({ email: selected.email })
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Clients & heures</h1>
        <p className="text-gray-500 text-sm mt-1">Suivez les heures achetées et consommées de chaque client</p>
      </div>

      <div className="flex gap-5">
        {/* Liste clients */}
        <div className="w-52 shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Clients</p>
            <button onClick={() => setShowAdd(true)} className="text-brand hover:text-brand-mid">
              <Plus size={16} />
            </button>
          </div>

          {showAdd && (
            <div className="border border-gray-200 rounded-lg p-3 mb-3 space-y-2">
              <input className="input text-xs" placeholder="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              <input className="input text-xs" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className="input text-xs" placeholder="Heures achetées" type="number" value={form.heures_achetees} onChange={e => setForm({ ...form, heures_achetees: Number(e.target.value) })} />
              <div className="flex gap-1.5">
                <button className="btn-primary text-xs px-2 py-1.5" onClick={addClient} disabled={loading}>Ajouter</button>
                <button className="btn-secondary text-xs px-2 py-1.5" onClick={() => setShowAdd(false)}>Annuler</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selected?.id === c.id ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <p className="truncate">{c.nom}</p>
                <p className="text-xs text-gray-400 truncate">{c.email}</p>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="flex-1 space-y-4">
            {/* Solde */}
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{selected.nom}</p>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-display font-bold text-gray-900">{solde}</p>
                    <p className="text-xs text-gray-400">heures restantes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-display font-bold text-gray-500">{selected.heures_achetees || 0}</p>
                    <p className="text-xs text-gray-400">achetées</p>
                  </div>
                  <button
                    onClick={sendMagicLink}
                    disabled={sending || !selected.email}
                    className="flex items-center gap-2 btn-secondary text-sm"
                  >
                    <Send size={15} />
                    {sending ? 'Envoi…' : sent ? '✓ Envoyé' : 'Envoyer le lien'}
                  </button>
                </div>
              </div>
            </div>

            {/* Débit d'heures */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm">Débiter des heures</h2>
              <div className="flex gap-3">
                <input
                  className="input flex-1 text-sm"
                  placeholder="Description (ex : séance du 12 jan)"
                  value={debit.description}
                  onChange={e => setDebit({ ...debit, description: e.target.value })}
                />
                <input
                  type="number"
                  className="input w-24 text-sm"
                  placeholder="Heures"
                  value={debit.heures}
                  onChange={e => setDebit({ ...debit, heures: Number(e.target.value) })}
                />
                <input
                  type="date"
                  className="input w-36 text-sm"
                  value={debit.date}
                  onChange={e => setDebit({ ...debit, date: e.target.value })}
                />
                <button className="btn-primary text-sm shrink-0" onClick={addDebit} disabled={loading}>
                  Débiter
                </button>
              </div>
            </div>

            {/* Historique */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm">Historique des séances</h2>
              {heures.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune séance enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {heures.map(h => (
                    <div key={h.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-900 font-medium">{h.description || 'Séance'}</p>
                        <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <span className="text-sm font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        -{h.heures_utilisees || h.heures} h
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
