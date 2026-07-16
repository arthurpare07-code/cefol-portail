# Guide de mise en ligne — Portail CEFOL

## Étape 1 — Créer votre base Supabase (gratuit)

1. Allez sur **supabase.com** → "New project"
2. Donnez un nom : `cefol-portail`
3. Choisissez un mot de passe fort (gardez-le)
4. Région : **West EU (Ireland)** (le plus proche de Nantes)
5. Cliquez **Create new project** (attendre ~2 minutes)

### Créer les tables
1. Dans Supabase → **SQL Editor** → "New query"
2. Copiez-collez tout le contenu du fichier `supabase_setup.sql`
3. Cliquez **Run**

### Récupérer vos clés API
1. Dans Supabase → **Settings** → **API**
2. Copiez :
   - **Project URL** → ex: `https://abcdefgh.supabase.co`
   - **anon public** → longue chaîne commençant par `eyJ...`

---

## Étape 2 — Configurer l'application

Créez un fichier `.env` à la racine du projet (là où est `package.json`) :

```
VITE_SUPABASE_URL=https://VOTRE_PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

---

## Étape 3 — Tester en local

```bash
npm install
npm run dev
```
L'app tourne sur **http://localhost:3000**

---

## Étape 4 — Créer votre compte admin

1. Allez sur http://localhost:3000/login
2. Connectez-vous avec votre email (mode "Mot de passe")
   - Supabase → Authentication → Users → "Add user" → entrez email + mot de passe
3. Une fois connecté, allez dans Supabase → **SQL Editor** et tapez :
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'votre@email.fr';
   ```
4. Rafraîchissez la page → vous êtes admin

---

## Étape 5 — Ajouter vos utilisateurs

### Profs et vendeurs
Dans Supabase → **Authentication** → **Users** → **Add user** :
- Entrez email + mot de passe
- Puis dans SQL Editor :
  ```sql
  UPDATE profiles SET role = 'prof', full_name = 'Marie Dupont'
  WHERE email = 'marie@cefol.fr';
  
  UPDATE profiles SET role = 'vendeur', full_name = 'Jean Martin'
  WHERE email = 'jean@cefol.fr';
  ```

### Clients
Les clients n'ont pas de compte Supabase Auth.
Ajoutez-les directement dans votre panneau admin → "Clients & heures" → bouton +
Ou importez-les via Excel → "Importer Excel"

Pour envoyer leur lien de connexion (magic link) :
→ Dans l'app, onglet client → bouton "Envoyer le lien"
→ Ils reçoivent un email avec un lien qui les connecte directement

---

## Étape 6 — Mettre en ligne sur Vercel (gratuit)

1. Créez un compte sur **vercel.com**
2. Installez Vercel CLI : `npm install -g vercel`
3. Dans le dossier du projet :
   ```bash
   vercel
   ```
4. Suivez les instructions (projet React/Vite détecté automatiquement)
5. Ajoutez vos variables d'environnement :
   - Vercel → votre projet → **Settings** → **Environment Variables**
   - Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
6. Redéployez : `vercel --prod`

Votre portail est en ligne sur `https://cefol-portail.vercel.app` (ou URL personnalisée)

---

## Import Excel — formats attendus

### Planning des cours
| email_prof | jour | heure_debut | heure_fin | groupe | salle |
|---|---|---|---|---|---|
| marie@cefol.fr | Lundi | 09:00 | 11:00 | B2 | Salle 3 |

### Sessions TEF IRN
| email_prof | date | heure | lieu | remarques |
|---|---|---|---|---|
| marie@cefol.fr | 2025-03-15 | 09:00 | Centre Nantes | 12 candidats |

### Congés vendeurs
| email_vendeur | annee | mois | jours_gagnes |
|---|---|---|---|
| jean@cefol.fr | 2025 | 1 | 2.5 |

### Heures clients
| email_client | description | heures_utilisees | date |
|---|---|---|---|
| client@gmail.com | Séance conversation | 2 | 2025-01-15 |

> **Téléchargez les modèles** directement depuis l'app : Importer Excel → "Télécharger le modèle"

---

## Évolutions futures possibles

- Notifications email automatiques (via Supabase Edge Functions)
- Demandes de congés en ligne par les vendeurs
- Calendrier visuel partagé pour les profs
- Facturation / compteur d'heures avec alertes
- Application mobile (React Native avec le même backend Supabase)
