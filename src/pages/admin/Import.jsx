import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react'

const TEMPLATES = [
  {
    id: 'cours',
    label: 'Planning des cours',
    description: 'Colonnes : email_prof, jour, heure_debut, heure_fin, groupe, salle',
    columns: ['email_prof', 'jour', 'heure_debut', 'heure_fin', 'groupe', 'salle'],
    table: 'cours',
    resolver: async (row) => {
      const { data: prof } = await supabase.from('profiles').select('id').eq('email', row.email_prof).single()
      if (!prof) return null
      return { prof_id: prof.id, jour: row.jour, heure_debut: row.heure_debut, heure_fin: row.heure_fin, groupe: row.groupe, salle: row.salle }
    }
  },
  {
    id: 'sessions_tef',
    label: 'Sessions TEF IRN',
    description: 'Colonnes : email_prof, date (JJ/MM/AAAA), heure, lieu, remarques',
    columns: ['email_prof', 'date', 'heure', 'lieu', 'remarques'],
    table: 'sessions_tef',
    resolver: async (row) => {
      const { data: prof } = await supabase.from('profiles').select('id').eq('email', row.email_prof).single()
      if (!prof) return null
      return { prof_id: prof.id, date: row.date, heure: row.heure, lieu: row.lieu, remarques: row.remarques }
    }
  },
  {
    id: 'conges',
    label: 'Congés vendeurs',
    description: 'Colonnes : email_vendeur, annee, mois (1-12), jours_gagnes',
    columns: ['email_vendeur', 'annee', 'mois', 'jours_gagnes'],
    table: 'conges',
    resolver: async (row) => {
      const { data: v } = await supabase.from('profiles').select('id').eq('email', row.email_vendeur).single()
      if (!v) return null
      return { vendeur_id: v.id, annee: Number(row.annee), mois: Number(row.mois), jours_gagnes: Number(row.jours_gagnes) }
    }
  },
  {
    id: 'heures_client',
    label: 'Heures clients',
    description: 'Colonnes : email_client, description, heures_utilisees, date',
    columns: ['email_client', 'description', 'heures_utilisees', 'date'],
    table: 'heures_client',
    resolver: async (row) => {
      const { data: c } = await supabase.from('clients').select('id').eq('email', row.email_client).single()
      if (!c) return null
      return { client_id: c.id, description: row.description, heures_utilisees: Number(row.heures_utilisees), date: row.date }
    }
  },
]

export default function Import() {
  const [template, setTemplate] = useState(TEMPLATES[0])
  const [preview, setPreview] = useState([])
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [result, setResult] = useState({ imported: 0, errors: 0 })
  const inputRef = useRef()

  function parseFile(f) {
    setFile(f)
    setStatus(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      setPreview(rows.slice(0, 5))
    }
    reader.readAsArrayBuffer(f)
  }

  async function doImport() {
    if (!file) return
    setStatus('loading')
    const reader = new FileReader()
    reader.onload = async (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      let imported = 0, errors = 0

      for (const row of rows) {
        const resolved = await template.resolver(row)
        if (!resolved) { errors++; continue }
        const { error } = await supabase.from(template.table).upsert(resolved)
        if (error) errors++; else imported++
      }

      setResult({ imported, errors })
      setStatus(errors === 0 ? 'success' : 'error')
    }
    reader.readAsArrayBuffer(file)
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([template.columns])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, `template_${template.id}.xlsx`)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Importer Excel</h1>
        <p className="text-gray-500 text-sm mt-1">Importez vos données depuis un fichier .xlsx ou .csv</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Choix du type */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Type de données</h2>
          <div className="space-y-2">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => { setTemplate(t); setPreview([]); setFile(null); setStatus(null) }}
                className={`w-full text-left px-3 py-3 rounded-lg border transition-colors ${
                  template.id === t.id
                    ? 'border-brand bg-brand-light'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className={`text-sm font-medium ${template.id === t.id ? 'text-brand' : 'text-gray-900'}`}>{t.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>

          <button onClick={downloadTemplate} className="btn-secondary w-full mt-4 text-sm flex items-center justify-center gap-2">
            <FileSpreadsheet size={15} />
            Télécharger le modèle Excel
          </button>
        </div>

        {/* Upload + import */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Fichier à importer</h2>
            <div
              onClick={() => inputRef.current.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand hover:bg-brand-light/50 transition-colors"
            >
              <Upload size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-700">{file ? file.name : 'Cliquez pour sélectionner'}</p>
              <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv</p>
            </div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => e.target.files[0] && parseFile(e.target.files[0])} />
          </div>

          {preview.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-medium text-gray-900 mb-2">Aperçu ({preview.length} premières lignes)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      {Object.keys(preview[0]).map(k => (
                        <th key={k} className="text-left text-gray-400 font-medium pb-1.5 pr-3">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="text-gray-700 pr-3 py-1 truncate max-w-24">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {file && (
            <button onClick={doImport} disabled={status === 'loading'} className="btn-primary w-full">
              {status === 'loading' ? 'Import en cours…' : `Importer dans "${template.label}"`}
            </button>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-lg text-sm">
              <Check size={16} />
              {result.imported} ligne(s) importée(s) avec succès
              {result.errors > 0 && ` · ${result.errors} ignorée(s)`}
            </div>
          )}
          {status === 'error' && result.imported === 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
              <AlertCircle size={16} />
              Erreur d'importation. Vérifiez les colonnes du fichier.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
