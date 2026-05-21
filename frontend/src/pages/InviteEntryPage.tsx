import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { isAxiosError } from 'axios'
import instance from '../api/axios'
import type { InvitationResolve } from '../types/models'

export default function InviteEntryPage() {
  const { inviteToken } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('Ověřuji pozvánku...')

  useEffect(() => {
    const resolveInvite = async () => {
      if (!inviteToken) {
        setMessage('Neplatný odkaz pozvánky.')
        return
      }

      try {
        const { data } = await instance.get<InvitationResolve>(`/invitations/${inviteToken}/resolve`)
        const targetPath = `/rides/${data.ride_id}?invite=${encodeURIComponent(inviteToken)}`
        const hasToken = Boolean(localStorage.getItem('access_token'))

        if (!hasToken) {
          localStorage.setItem('post_login_redirect', targetPath)
          navigate('/login', { replace: true })
          return
        }

        navigate(targetPath, { replace: true })
      } catch (error) {
        if (isAxiosError(error)) {
          if (error.response?.status === 410) {
            setMessage('Pozvánka vypršela. Požádejte o novou.')
            return
          }
          if (error.response?.status === 404) {
            setMessage('Pozvánka nebyla nalezena.')
            return
          }
        }
        setMessage('Pozvánku se nepodařilo ověřit. Zkuste to znovu.')
      }
    }

    void resolveInvite()
  }, [inviteToken, navigate])

  return (
    <div className="page-container page-container-auth">
      <div className="page-content">
        <div className="form-container">
          <div className="main-card">
            <div className="main-card-header text-center">
              <h1 className="text-2xl font-bold">Pozvánka do jízdy</h1>
            </div>
            <div className="main-card-body text-center">
              <p className="text-sm text-secondary">{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
