import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Agenda from '../../components/Agenda'

export default function AdminAgendas() {
  const [personnes, setPersonnes] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    supabase.from('profiles').select('*').in('role', ['prof', 'vendeur']).order('full_name')
      .then(({ data }) => { setPersonnes(data || []); if (data?.length) setSelected(data[0]) })
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Agendas</h1>
        <p className="text-gray-500 text-sm mt-1">Gérez l'agenda de chaque personne — semaine ou mois</p>
      </div>

      <div className="flex gap-5">
        <div className="w-48 shrink-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">Personnes</p>
          <div className="space-y-1">
            {personnes.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selected?.id === p.id ? 'bg-brand-light text-brand font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <p className="truncate">{p.full_name || p.email}</p>
                <p className="text-xs text-gray-400 capitalize">{p.role}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {selected && <Agenda userId={selected.id} canEdit={true} />}
        </div>
      </div>
    </div>
  )
}
