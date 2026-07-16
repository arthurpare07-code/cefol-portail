import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const JOURS_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5,
  5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]

export default function AdminVendeurs() {
  const [vendeurs, setVendeurs] = useState([])
  const [selected, setSelected] = useState(null)
  const [conges, setConges] = useState([])
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'vendeur').order('full_name')
      .then(({ data }) => { setVendeurs(data || []); if (data?.length) setSelected(data[0]) })
  }, [])

  useEffect(() => {
    if (!selected) return
    supabase.from('conges').select('*')
      .eq('vendeur_id', selected.id).eq('annee', annee)
      .then(({ data }) => setConges(data || []))
  }, [selected, annee])

  function getJours(moisIndex) {
    return conges.find(c => c.mois === moisIndex + 1)?.jours_gagnes ?? 0
  }

  async function setJours(moisIndex, valeur) {
    const mois = moisIndex + 1
    const existing = conges.find(c => c.mois === mois)
    if (existing) {
      const updated = conges.map(c => c.mois === mois ? { ...c, jours_gagnes: valeur } : c)
      setConges(updated)
    } else {
      setConges([...conges, { vendeur_id: selected.id, annee, mois, jours_gagnes: valeur }])
    }
  }

  async function saveAll() {
    setSaving(true)
    for (const moisIndex of MOIS.keys()) {
      const mois = moisIndex + 1
      const jours = getJours(moisIndex)
      const existing = conges.find(c => c.mois === mois)
      if (existing?.id) {
        await supabase.from('conges').update({ jours_gagnes: jours }).eq('id', existing.id)
      } else {
        await supabase.from('conges').upsert({ vendeur_id: selected.id, annee, mois, jours_gagnes: jours })
      }
    }
    const { data } = await supabase.from('conges').select('*').eq('vendeur_id', selected.id).eq('annee', annee)
    setConges(data || [])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const totalAnnee = MOIS.reduce((sum, _, i) => sum + getJours(i), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Vendeurs & congés</h1>
        <p className="text-gray-500 text-sm mt-1">Saisissez les jours de congés acquis mois par mois</p>
      </div>

      <div className="flex gap-5">
        {/* Liste vendeurs */}
        <div className="w-48 shrink-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">Vendeurs</p>
          <div className="space-y-1">
            {vendeurs.map(v => (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selected?.id === v.id ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {v.full_name || v.email}
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="flex-1">
            <div className="card">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">{selected.full_name || selected.email}</p>
                  <p className="text-xs text-gray-400">Congés annuels</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={annee}
                    onChange={e => setAnnee(Number(e.target.value))}
                    className="input w-28 text-sm"
                  >
                    {[annee - 1, annee, annee + 1].map(a => <option key={a}>{a}</option>)}
                  </select>
                  <div className="text-right">
                    <p className="text-2xl font-display font-bold text-gray-900">{totalAnnee}</p>
                    <p className="text-xs text-gray-400">jours total</p>
                  </div>
                </div>
              </div>

              {/* Grille mois */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-3">
                  {MOIS.map((mois, i) => (
                    <div key={mois} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                      <span className="text-sm font-medium text-gray-700 w-24">{mois}</span>
                      <select
                        value={getJours(i)}
                        onChange={e => setJours(i, Number(e.target.value))}
                        className="border border-gray-200 rounded-md px-2 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-20"
                      >
                        {JOURS_OPTIONS.map(j => (
                          <option key={j} value={j}>{j} j</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button onClick={saveAll} disabled={saving} className="btn-primary">
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                  {saved && <span className="text-sm text-green-600 font-medium">✓ Enregistré</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
