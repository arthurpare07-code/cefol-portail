import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { Upload, Check, AlertCircle } from 'lucide-react'

function excelDate(v) {
  if (!v) return null
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000))
    return d.toISOString().slice(0, 10)
  }
  return String(v)
}

const TEMPLATES = [
  {
    id: 'stagiaires',
    label: 'Stagiaires (clients)',
    description: 'Fiche de chaque stagiaire : heures, avancement, notes TEF',
    table: 'stagiaires',
    conflict: 'email',
    resolver: (row) => ({
      email: String(row.email || '').trim().toLowerCase(),
      nom_complet: row.nom_complet || '',
      heures_commandees: Number(row.heures_commandees) || 0,
      heures_realisees: Number(row.heures_realisees) || 0,
      avancement: Number(row.avancement_pct) || 0,
      niveau: row.niveau || null,
      groupe: row.groupe || null,
      type_parcours: row.type_parcours || null,
      date_debut: excelDate(row.date_debut),
      date_fin: excelDate(row.date_fin),
      tef_objectif: row.tef_objectif || null,
      tef_note_ce: row.tef_note_ce ? Number(row.tef_note_ce) : null,
      tef_note_co: row.tef_note_co ? Number(row.tef_note_co) : null,
      tef_note_ee: row.tef_note_ee ? Number(row.tef_note_ee) : null,
      tef_note_eo: row.tef_note_eo ? Number(row.tef_note_eo) : null,
    }),
  },
  {
    id: 'seances',
    label: 'Seances (cours)',
    description: 'Planning des cours de chaque stagiaire',
    table: 'seances',
    conflict: null,
    resolver: (row) => ({
      stagiaire_email: String(row.email_stagiaire || '').trim().toLowerCase(),
      reference: row.titre_seance || '',
      date_prevue: excelDate(row.date_prevue),
      statut: row.statut || null,
      heures_cumulees: row.heures_cumulees ? Number(row.heures_cumulees) : null,
      notes: row.notes || null,
    }),
  },
  {
    id: 'cours',
    label: 'Planning des cours (profs)',
    description: 'Colonnes : email_prof, jour, heure_debut, heure_fin, groupe, salle',
    table: 'cours',
    conflict: null,
    resolver: async (row) => {
      const { data: prof } = await supabase.from('profiles').select('id').eq('email', row.email_prof).single()
      if (!prof) return null
      return { prof_id: prof.id, jour: row.jour, heure_debut: row.heure_debut, heure_fin: row.heure_fin, groupe: row.groupe, salle: row.salle }
    },
  },
]

export default function Import() {
  const [template, setTemplate] = useState(TEMPLATES[0])
  const [preview, setPreview] = useState([])
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null)
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

      if (template.id === 'seances') {
        const emails = [...new Set(rows.map(r => String(r.email_stagiaire || '').trim().toLowerCase()).filter(Boolean))]
        for (const em of emails) {
          await supabase.from('seances').delete().eq('stagiaire_email', em)
        }
      }

      for (const row of rows) {
        let resolved = template.resolver.constructor.name === 'AsyncFunction'
          ? await template.resolver(row)
          : template.resolver(row)
        if (!resolved || !Object.values(resolved).some(v => v)) { errors++; continue }

        let error
        if (template.conflict) {
          ({ error } = await supabase.from(template.table).upsert(resolved, { onConflict: template.conflict }))
        } else {
          ({ error } = await supabase.from(template.table).insert(resolved))
        }
        if (error) errors++; else imported++
      }

      setResult({ imported, errors })
      setStatus(errors === 0 ? 'success' : 'error')
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Importer Excel</h1>
        <p className="text-gray-500 text-sm mt-1">Importez vos donnees depuis un fichier .xlsx ou .csv</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Type de donnees</h2>
          <div className="space-y-2">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => { setTemplate(t); setPreview([]); setFile(null); setStatus(null) }}
                className={`w-full text-left px-3 py-3 rounded-lg border transition-colors ${
                  template.id === t.id ? 'border-brand bg-brand-light' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className={`text-sm font-medium ${template.id === t.id ? 'text-brand' : 'text-gray-900'}`}>{t.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Fichier a importer</h2>
