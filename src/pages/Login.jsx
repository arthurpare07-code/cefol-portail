import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn, signInMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'password') {
        const { error } = await signIn(email, password)
        if (error) setError('Erreur : ' + error.message)
      } else {
        const { error } = await signInMagicLink(email)
        if (error) setError('Erreur : ' + error.message)
        else setSuccess('Lien de connexion envoyé ! Vérifiez votre boîte mail.')
      }
    } catch (err) {
      setError('Erreur technique : ' + (err?.message || String(err)))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-display font-bold text-xl">C</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Portail CEFOL</h1>
          <p className="text-gray-500 text-sm mt-1">Connectez-vous à votre espace</p>
        </div>

        <div className="card p-6">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => { setMode('password'); setError(''); setSuccess('') }}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                mode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mot de passe
            </button>
            <button
              onClick={() => { setMode('magic'); setError(''); setSuccess('') }}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                mode === 'magic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Lien par email
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="prenom@cefol.fr"
                required
              />
            </div>

            {mode === 'password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  placeholder="mot de passe"
                  required
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-lg px-3 py-2.5">
                {success}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Connexion…' : mode === 'password' ? 'Se connecter' : 'Recevoir le lien'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Probleme de connexion ? Contactez l'administration.
        </p>
      </div>
    </div>
  )
}
