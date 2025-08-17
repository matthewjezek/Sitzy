import { useEffect, useState } from 'react'
import instance from '../api/axios'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { isAxiosError } from 'axios'

interface Invitation {
  id: string
  car_id: string
  invited_email: string
  token: string
  status: string
  status_label: string
  created_at: string
  expires_at: string | null
}

export default function InvitationListPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const axios = instance
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:8000/invitations/received', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInvitations(res.data)
    } catch (err: unknown) {
      setError('Nepodařilo se načíst pozvánky.' + (err instanceof Error ? ' ' + err.message : ''));
      console.error(err);
      if (isAxiosError(err) && !(err.response?.status === 404)) {
        toast.error('Chyba načtení pozvánek.');
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (token: string) => {
    try {
      const auth = localStorage.getItem('token')
      await axios.post(`http://localhost:8000/invitations/${token}/accept`, {}, {
        headers: { Authorization: `Bearer ${auth}` },
      })
      toast.success('Pozvánka přijata!')
      fetchInvitations()
    } catch {
      toast.error('Přijetí pozvánky selhalo.')
    }
  }

  const handleReject = async (token: string) => {
    try {
      const auth = localStorage.getItem('token')
      await axios.post(`http://localhost:8000/invitations/${token}/reject`, {}, {
        headers: { Authorization: `Bearer ${auth}` },
      })
      toast.info('Pozvánka odmítnuta.')
      fetchInvitations()
    } catch {
      toast.error('Odmítnutí pozvánky selhalo.')
    }
  }

  if (loading) return <div className="text-center mt-8">Načítání...</div>
  if (!loading && invitations.length === 0) {
    return (
      <div className="text-center mt-8 text-gray-600">
        <h2 className="text-xl font-semibold mb-2">Seznam pozvánek</h2>
        <p className="mb-4">Aktuálně nemáte žádné pozvánky.</p>
      </div>
    )
  }
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex flex-col gap-4">
        {invitations.map((inv) => (
          <div key={inv.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200">
            <div className="flex-1">
              <div className="font-semibold">Pozvánka do auta</div>
              <div className="text-sm text-gray-600">E-mail: <span className="font-mono">{inv.invited_email}</span></div>
              <div className="text-sm text-gray-600">Stav: <span className="font-semibold">{inv.status_label}</span></div>
              <div className="text-xs text-gray-400">Vytvořeno: {new Date(inv.created_at).toLocaleString('cs-CZ', { timeZone: localTimezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
              {inv.expires_at && <div className="text-xs text-gray-400">Platnost do: {new Date(inv.expires_at).toLocaleString('cs-CZ', { timeZone: localTimezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>}
            </div>
            <div className="flex flex-row gap-2 mt-2 md:mt-0 md:ml-4">
              {inv.status === 'PENDING' && (
                <>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    onClick={() => handleAccept(inv.token)}
                  >
                    Přijmout
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => handleReject(inv.token)}
                  >
                    Odmítnout
                  </button>
                </>
              )}
              {inv.status === 'ACCEPTED' && (
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  onClick={() => navigate('/seats')}
                >
                  Vybrat místo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
