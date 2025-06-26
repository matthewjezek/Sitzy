import { useNavigate } from 'react-router-dom'

export default function LogoutButton() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-red-600 hover:underline ml-4"
    >
      Odhlásit se
    </button>
  )
}
