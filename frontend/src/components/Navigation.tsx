import { useState } from 'react';
import { useNavigate } from 'react-router';

const Button = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop navigace */}
      <div className="navigation hidden md:flex justify-between items-center">
        {/* Levá skupina tlačítek */}
        <div className="flex items-center gap-2">
          <button
            className="nav-button glass gap-0 group overflow-hidden transition-all duration-300 ease-in hover:gap-2"
            onClick={() => navigate(-1)}
          >
            <svg
              className="lucide lucide-arrow-left"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
              viewBox="0 0 24 24"
              height={22}
              width={22}
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span className="whitespace-nowrap max-w-0 overflow-hidden transition-all duration-300 ease-in group-hover:max-w-[100px]">
              Zpět
            </span>
          </button>

          <button
            className="nav-button glass hover:text-cyan-400"
            onClick={() => navigate('/')}
          >
            <svg
              className="lucide lucide-rocket text-cyan-400"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              fill="none"
              viewBox="0 0 24 24"
              height={22}
              width={22}
            >
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
            Dashboard
          </button>

          <button
            className="nav-button glass hover:text-fuchsia-500"
            onClick={() => navigate('/seats')}
          >
            <svg
              className="lucide lucide-car-seat text-fuchsia-500"
              stroke="currentColor"
              strokeWidth={1.5}
              fill="none"
              viewBox="0 0 24 24"
              height={22}
              width={22}
            >
              <rect x="7" y="6" width="10" height="8" rx="3" />
              <rect x="5" y="14" width="14" height="7" rx="2" />
              <path d="M9 6v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
            </svg>
            Jízdy
          </button>

          <button
            className="nav-button glass hover:text-amber-400"
            onClick={() => navigate('/invitations')}
          >
            <svg
              className="lucide lucide-envelope text-yellow-400"
              stroke="currentColor"
              strokeWidth={1.5}
              fill="none"
              viewBox="0 0 24 24"
              height={22}
              width={22}
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <polyline points="3 7 12 13 21 7" />
            </svg>
            Pozvánky
          </button>

          <button
            className="nav-button glass hover:text-orange-500"
            onClick={() => navigate('/car')}
          >
            <svg
              className="text-orange-500"
              stroke="currentColor"
              strokeWidth={1.5}
              fill="none"
              viewBox="0 0 24 24"
              height={22}
              width={22}
            >
              <rect x="2" y="10" width="20" height="9" rx="2" />
              <path d="m20.772 10.156-1.368-4.105A2.995 2.995 0 0 0 16.559 4H7.441a2.995 2.995 0 0 0-2.845 2.051l-1.368 4.105A2.003" />
              <circle cx="6" cy="14.5" r="1.5" />
              <circle cx="18" cy="14.5" r="1.5" />
              <rect x="3" y="19" width="3" height="3" rx="1" />
              <rect x="18" y="19" width="3" height="3" rx="1" />
            </svg>
            Moje auto
          </button>
        </div>

        {/* Pravá skupina tlačítek */}
        <div>
          <button
            className="nav-button glass hover:text-red-600"
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
          >
            <svg
              className="text-red-600"
              stroke="currentColor"
              strokeWidth={1.5}
              fill="none"
              viewBox="0 0 24 24"
              height={22}
              width={22}
            >
              <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Odhlásit se
          </button>
        </div>
      </div>

      {/* Mobilní navigace */}
      <div className="top-0 left-0 w-full z-50 max-w-screen-xl flex flex-wrap items-center justify-between p-4 md:hidden">
        <a
          href="https://example.com/"
          className="flex items-center space-x-3 rtl:space-x-reverse"
        >
          <span className="text-3xl font-semibold text-gray-700">Sitzy</span>
        </a>
        <button
          id="mobile-menu-button"
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-controls="navbar-default"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth={1.5}
            fill="none"
            viewBox="0 0 17 14"
          >
            <path d="M1 1h15M1 7h15M1 13h15" />
          </svg>
        </button>
        <div
          className={`top-16 left-0 w-full z-50 ${menuOpen ? '' : 'hidden'}`}
          id="mobile-menu"
        >
          <ul className="font-medium flex flex-col gap-2 p-4 mt-4 rounded-xl rtl:space-x-reverse glass">
            <li>
              <a
                href="/"
                className="block py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Dashboard
              </a>
            </li>
            <hr />
            <li>
              <a
                href="/seats"
                className="block py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Jízdy
              </a>
            </li>
            <li>
              <a
                href="/invitations"
                className="block py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Pozvánky
              </a>
            </li>
            <li>
              <a
                href="/car"
                className="block py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Moje auto
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Button;
