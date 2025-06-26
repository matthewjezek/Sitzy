import { Link } from 'react-router-dom'
import LogoutButton from './LogoutButton'

export default function Navigation() {
  return (
    <nav className="bg-gray-800 text-white px-4 py-2">
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
<div className="flex items-center gap-4">
  <LogoutButton />
</div>

    </nav>
  )
}
