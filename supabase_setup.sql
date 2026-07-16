-- ============================================================
-- CEFOL Portail — Script de création des tables Supabase
-- À coller dans : Supabase > SQL Editor > New Query
-- ============================================================

-- 1. Table profiles (liée aux utilisateurs Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'prof', 'vendeur', 'client')) NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : crée automatiquement un profil à chaque inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Table cours (planning hebdomadaire des profs)
CREATE TABLE cours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prof_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  jour TEXT CHECK (jour IN ('Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi')),
  heure_debut TIME,
  heure_fin TIME,
  groupe TEXT,
  salle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table sessions_tef (sessions TEF IRN)
CREATE TABLE sessions_tef (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prof_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure TIME,
  lieu TEXT,
  remarques TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table congés (jours acquis par mois pour les vendeurs)
CREATE TABLE conges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendeur_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  jours_gagnes NUMERIC(4,1) DEFAULT 0,
  UNIQUE(vendeur_id, annee, mois)
);

-- 5. Table clients (indépendante de auth.users pour les clients sans compte)
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT UNIQUE,
  heures_achetees NUMERIC(6,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table heures_client (historique des séances)
CREATE TABLE heures_client (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  description TEXT,
  heures_utilisees NUMERIC(5,1) DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Sécurité Row Level Security (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cours ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_tef ENABLE ROW LEVEL SECURITY;
ALTER TABLE conges ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE heures_client ENABLE ROW LEVEL SECURITY;

-- Profiles : chacun voit son propre profil ; admin voit tout
CREATE POLICY "Profil personnel" ON profiles FOR SELECT USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin modifie profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Cours : prof voit les siens, admin voit tout
CREATE POLICY "Prof voit ses cours" ON cours FOR SELECT USING (
  prof_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin gère cours" ON cours FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Sessions TEF : idem
CREATE POLICY "Prof voit ses sessions" ON sessions_tef FOR SELECT USING (
  prof_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin gère sessions" ON sessions_tef FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Congés : vendeur voit les siens, admin voit tout
CREATE POLICY "Vendeur voit ses conges" ON conges FOR SELECT USING (
  vendeur_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin gère conges" ON conges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Clients et heures : admin seulement + client par email
CREATE POLICY "Admin gère clients" ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Client voit son dossier" ON clients FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Admin gère heures" ON heures_client FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Client voit ses heures" ON heures_client FOR SELECT USING (
  client_id IN (
    SELECT id FROM clients WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- ============================================================
-- Exemple : créer votre compte admin
-- Après avoir créé votre compte via l'interface, exécutez :
-- UPDATE profiles SET role = 'admin' WHERE email = 'votre@email.fr';
-- ============================================================
