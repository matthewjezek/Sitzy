import { useState } from 'react'
import axios from 'axios'

export default function InvitationPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
      setError('Chybí autentizační token. Přihlaste se prosím znovu.')
      setSuccess('')
      return
    }
    await axios.post(
      'http://localhost:8000/cars/invite',
      { invited_email: email },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setSuccess('Pozvánka úspěšně odeslána')
    setError('')
    setEmail('')
  } catch (err) {
    setSuccess('')
    if (axios.isAxiosError(err) && err.response && err.response.data && err.response.data.detail) {
      setError(err.response.data.detail)
    } else {
      setError('Chyba při odesílání pozvánky')
    }
    }
  }

    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleInvite}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Pozvat pasažéra</h2>

        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-500 text-sm">{success}</div>}

        <input
          type="email"
          placeholder="Email pozvaného"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Odeslat pozvánku
        </button>

        <p className="text-center text-sm">
          <a href="/car" className="text-blue-600 hover:underline">
            Zpět na auto
          </a>
        </p>
      </form>
    </div>
  )
}