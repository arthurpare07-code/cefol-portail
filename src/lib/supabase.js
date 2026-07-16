import { createClient } from '@supabase/supabase-js'

// Remplacer par vos valeurs Supabase (Settings > API)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://VOTRE_PROJET.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'VOTRE_CLE_ANON'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Rôles utilisateurs
export const ROLES = {
  ADMIN: 'admin',
  PROF: 'prof',
  VENDEUR: 'vendeur',
  CLIENT: 'client',
}
