import { useAuth } from '../../hooks/useAuth'
import Agenda from '../../components/Agenda'

export default function MonAgenda() {
  const { profile } = useAuth()

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Mon agenda</h1>
        <p className="text-gray-500 text-sm mt-1">Vos événements — basculez entre semaine et mois</p>
      </div>
      {profile && <Agenda userId={profile.id} canEdit={false} />}
    </div>
  )
}
