import { Link } from 'react-router-dom'
import { FiLogOut } from 'react-icons/fi'

export default function Navigation() {
  return (
    <nav className="bg-gray-800 text-white px-4 py-2">
      <div className="flex items-center justify-between">
        <ul className="flex items-center space-x-4">
          <li>
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/seats" className="hover:underline">
              Místa
            </Link>
          </li>
          <li>
            <Link to="/invitations" className="hover:underline">
              Pozvánky
            </Link>
          </li>
          <li>
            <Link to="/car" className="hover:underline">
              Auto
            </Link>
          </li>
        </ul>
        <button
          onClick={() => {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }}
          className="flex items-center gap-2 text-white hover:text-red-400 transition-colors"
        >
          <FiLogOut size={20} />
          Odhlásit se
        </button>
      </div>
    </nav>
  )
}
