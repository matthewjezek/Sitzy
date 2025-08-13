import { useNavigate } from 'react-router-dom'
import { FaCar } from 'react-icons/fa6';


const Button = () => {
  const navigate = useNavigate();
  return (
    <div className="navigation">
      {/* Levá skupina tlačítek */}
      <div className="flex items-center gap-2">
        <button className="nav-button hover:bg-gray-100 h-9 px-3 group">
          <svg className="lucide lucide-arrow-left" stroke="currentColor" fill="none" viewBox="0 0 24 24" height={22} width={22}>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          <span className="origin-left scale-0 transition-transform group-hover:scale-100">Zpět</span>
        </button>

        <button className="nav-button hover:bg-gray-100 hover:text-cyan-400"
          onClick={() => navigate('/')}>
          <svg className="lucide lucide-rocket text-cyan-400 dark:text-cyan-500" stroke="currentColor" fill="none" viewBox="0 0 24 24" height={22} width={22}>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
          </svg>
          Dashboard
        </button>

        <button className="nav-button hover:bg-gray-100 hover:text-blue-400"
          onClick={() => navigate('/seats')}>
          <svg className="lucide lucide-car-seat text-blue-400 dark:text-blue-600" stroke="currentColor" fill="none" viewBox="0 0 24 24" height={22} width={22}>
            <rect x="7" y="6" width="10" height="8" rx="3" />
            <rect x="5" y="14" width="14" height="7" rx="2" />
            <path d="M7 6v-1a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" />
          </svg>
          Jízdy
        </button>

            <button className="nav-button hover:bg-gray-100 hover:text-amber-400"
            onClick={() => navigate('/invitations')}>
          <svg className="lucide lucide-envelope text-amber-400 dark:text-amber-500" stroke="currentColor" fill="none" viewBox="0 0 24 24" height={22} width={22}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <polyline points="3 7 12 13 21 7" />
          </svg>
          Pozvánky
        </button>

        <button className="nav-button hover:bg-gray-100 hover:text-orange-400"
          onClick={() => navigate('/car')}>
          <FaCar size={18} className="text-amber-500 dark:text-amber-600" />
          Moje auto
        </button>
      </div>

      {/* Pravá skupina */}
      <div>
        <button className="nav-button hover:bg-gray-100 hover:text-red-400"
          onClick={() => {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }}>
          <svg className="lucide lucide-log-out text-red-400 dark:text-red-600" stroke="currentColor" fill="none" viewBox="0 0 24 24" height={22} width={22}>
            <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Odhlásit se
        </button>
      </div>
    </div>
  );
}

export default Button;


