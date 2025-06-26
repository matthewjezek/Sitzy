import { Link } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav className="bg-gray-800 text-white px-4 py-2">
      <ul className="flex space-x-4">
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/seats">Místa</Link></li>
        <li><Link to="/invitations">Pozvánky</Link></li>
        <li><Link to="/car">Auto</Link></li>
        <li><Link to="/logout">Odhlásit</Link></li>
      </ul>
    </nav>
  )
}
