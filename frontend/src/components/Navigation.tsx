import { useState, useRef, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { useInvites } from '../hooks/useInvites';
import { NotificationDialog, InvitationDialog } from './Dialog';
import { useCar } from '../hooks/useCar';

const Button = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { fetchCarById } = useCar();

  {/* Notifikace */}
  const {
    invites,
    loading: invitesLoading,
    fetchInvites,
    respondInvite,
  } = useInvites();

  // Lokální read state pro notifikace
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  const notifRef = useRef<HTMLDialogElement|null>(null);
  const invitationRef = useRef<HTMLDialogElement|null>(null);

  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const notifications = invites.map(inv => ({
    id: inv.token,
    title: "Pozvánka na jízdu",
    message: `Máte novou pozvánku od ${inv.invited_email}`,
    type: "info" as const,
    created_at: new Date(inv.created_at),
    read: inv.status !== "Pending" || readSet.has(inv.token),
  }));

  const markAsRead = (id: string) => {
    setReadSet(prev => new Set(prev).add(id));
  };

  const markAllAsRead = () => {
    setReadSet(new Set(invites.map(i => i.token)));
  };

  const openNotifications = () => {
    fetchInvites();
    notifRef.current?.showModal();
  };

  const openInvitationByToken = (token: string) => {
    setSelectedToken(token);
    // Dialog se otevře automaticky po načtení carData v useEffect
  };

  const closeInvitation = () => {
    invitationRef.current?.close();
    setSelectedToken(null);
    setCarData(null);
  };

  const selectedInvite = selectedToken ? invites.find(i => i.token === selectedToken) : null;
  const [carData, setCarData] = useState<{ name: string; owner: string; date: string } | null>(null);

  useEffect(() => {
    if (!selectedInvite) return;

    const fetchCar = async () => {
      const carInfo = await fetchCarById(selectedInvite.car_id);
      if (carInfo) {
        setCarData({
          name: carInfo.name,
          owner: carInfo.owner_name || 'Neznámý řidič',
          date: carInfo.date || '',
        });
      }
    };

    fetchCar();
  }, [selectedInvite, fetchCarById]);

  // Otevřít dialog po načtení carData
  useEffect(() => {
    if (selectedInvite && carData) {
      invitationRef.current?.showModal();
    }
  }, [selectedInvite, carData]);

  return (
    <>
      {/* Desktop navigace */}
      <div className="navigation hidden md:flex justify-between items-center">
        {/* Levá skupina tlačítek */}
        <div className="flex items-center gap-2">
          <button
            className="nav-button glass gap-0 group transition-all duration-300 ease-in hover:gap-2"
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
            className="nav-button glass hover:text-violet-500"
            onClick={() => navigate('/seats')}
          >
            <svg
              className="lucide lucide-car-seat text-violet-500"
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
            className="nav-button glass hover:text-fuchsia-500"
            onClick={() => navigate('/car')}
          >
            <svg
              className="text-fuchsia-500"
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
           <span className="font-">Moje auto</span>
          </button>
        </div>

        {/* Pravá skupina tlačítek */}
        <div className="flex items-center gap-2">
          <button
            onClick={openNotifications}
            className="nav-button p-0 glass rounded-full w-9 h-9 flex items-center justify-center relative"
          >
            <FiBell className="text-sky-500" size={20} />
            {notifications.some(n => !n.read) && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full px-1.5 py-0.5 text-xs min-w-5 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          <button 
            className="nav-button p-0 glass rounded-full w-9 h-9 flex items-center justify-center hover:text-sky-800"
            onClick={() => navigate('/settings')}
          >
            <svg
              className="text-sky-800"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              viewBox="0 0 20 20"
              width={22}
              height={22}
            >
              <circle r="2.5" cy={10} cx={10} />
              <path
                fillRule="evenodd"
                d="m8.39079 2.80235c.53842-1.51424 2.67991-1.51424 3.21831-.00001.3392.95358 1.4284 1.40477 2.3425.97027 1.4514-.68995 2.9657.82427 2.2758 2.27575-.4345.91407.0166 2.00334.9702 2.34248 1.5143.53842 1.5143 2.67996 0 3.21836-.9536.3391-1.4047 1.4284-.9702 2.3425.6899 1.4514-.8244 2.9656-2.2758 2.2757-.9141-.4345-2.0033.0167-2.3425.9703-.5384 1.5142-2.67989 1.5142-3.21831 0-.33914-.9536-1.4284-1.4048-2.34247-.9703-1.45148.6899-2.96571-.8243-2.27575-2.2757.43449-.9141-.01669-2.0034-.97028-2.3425-1.51422-.5384-1.51422-2.67994.00001-3.21836.95358-.33914 1.40476-1.42841.97027-2.34248-.68996-1.45148.82427-2.9657 2.27575-2.27575.91407.4345 2.00333-.01669 2.34247-.97026z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            className="nav-button glass gap-0 group transition-all duration-300 ease-in hover:gap-2 hover:text-red-600"
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
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
            <span className="whitespace-nowrap max-w-0 overflow-hidden transition-all duration-300 ease-in group-hover:max-w-[100px]">
              Odhlásit se
            </span>
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
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 relative"
              onClick={openNotifications}
            >
              <FiBell size={20} />
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full px-1.5 py-0.5 text-xs min-w-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
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
          </div>
        <div
          className={`top-16 left-0 w-full z-50 ${menuOpen ? '' : 'hidden'}`}
          id="mobile-menu"
        >
          <ul className="font-medium flex flex-col gap-2 p-4 mt-4 rounded-xl rtl:space-x-reverse card">
            <li>
              <a
                href="/"
                className="inline-flex items-center gap-2 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
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
              </a>
            </li>
            <hr className="border-gray-200" />
            <li>
              <a
                href="/seats"
                className="inline-flex items-center gap-2 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <svg
                  className="lucide lucide-car-seat text-violet-500"
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
              </a>
            </li>
            <hr className="border-gray-200" />
            <li>
              <a
                href="/car"
                className="inline-flex items-center gap-2 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <svg
                  className="text-fuchsia-500"
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
              </a>
            </li>
            <hr className="border-gray-200" />
            <li>
              <a
                href="/settings"
                className="inline-flex items-center gap-2 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <svg
                  className="text-sky-800"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  viewBox="0 0 20 20"
                  width={22}
                  height={22}
                >
                  <circle r="2.5" cy={10} cx={10} />
                  <path
                    fillRule="evenodd"
                    d="m8.39079 2.80235c.53842-1.51424 2.67991-1.51424 3.21831-.00001.3392.95358 1.4284 1.40477 2.3425.97027 1.4514-.68995 2.9657.82427 2.2758 2.27575-.4345.91407.0166 2.00334.9702 2.34248 1.5143.53842 1.5143 2.67996 0 3.21836-.9536.3391-1.4047 1.4284-.9702 2.3425.6899 1.4514-.8244 2.9656-2.2758 2.2757-.9141-.4345-2.0033.0167-2.3425.9703-.5384 1.5142-2.67989 1.5142-3.21831 0-.33914-.9536-1.4284-1.4048-2.34247-.9703-1.45148.6899-2.96571-.8243-2.27575-2.2757.43449-.9141-.01669-2.0034-.97028-2.3425-1.51422-.5384-1.51422-2.67994.00001-3.21836.95358-.33914 1.40476-1.42841.97027-2.34248-.68996-1.45148.82427-2.9657 2.27575-2.27575.91407.4345 2.00333-.01669 2.34247-.97026z"
                    clipRule="evenodd"
                  />
                </svg>
                Nastavení
              </a>
            </li>
            <hr className="border-gray-200" />
            <li>
              <a
                onClick={() => localStorage.removeItem('token')}
                href="/login"
                className="inline-flex items-center gap-2 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
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
              </a>
            </li>
          </ul>
        </div>
      </div>
      <NotificationDialog
        ref={notifRef}
        toggle={() => notifRef.current?.close()}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onOpen={openInvitationByToken}
      />
      {selectedInvite && carData && (
        <InvitationDialog
          ref={invitationRef}
          toggle={closeInvitation}
          invitation={{
            id: selectedInvite.token,
            carName: carData.name,
            ownerName: carData.owner,
            date: carData.date,
            token: selectedInvite.token,
          }}
          onAccept={(token) => respondInvite(token, true)}
          onDecline={(token) => respondInvite(token, false)}
          loading={invitesLoading}
        />
      )}
    </>
  );
};

export default Button;
