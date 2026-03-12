import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FiPlus, FiList } from 'react-icons/fi';
import { useRide } from '../hooks/useRide';
import { useAuth } from '../hooks/useAuth';
import { formatLocalDateTime } from '../utils/datetime';
import { CarIcon } from '../assets/icons';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rides, fetchMyRides, loading } = useRide();

  useEffect(() => {
    fetchMyRides();
    document.title = 'Sitzy - Přehled';
  }, [fetchMyRides]);

  const now = new Date();
  
  const upcomingRide = rides
    .filter(r => new Date(r.departure_time) > now)
    .sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime())[0] || null;

  return (
    <div className="page-container flex-col items-center pt-24 pb-10">
      <div className="page-content max-w-2xl mx-auto w-full flex flex-col gap-8">
        
        {/* Hlavička */}
        <header>
          <h1 className="page-title">
            Ahoj, {user?.full_name?.split(' ')[0] || 'řidiči'}! 👋
          </h1>
          <p className="text-secondary mt-2">Vítej zpět. Co máš dnes v plánu?</p>
        </header>

        {/* Rychlé akce */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="group" aria-label="Rychlé akce">
          <button 
            onClick={() => navigate('/rides/new')} 
            className="card card-interactive p-5 flex items-center justify-between hover-border-accent text-left group"
          >
            <div>
              <h3 className="font-bold text-lg mb-1">Nová jízda</h3>
              <p className="text-sm text-secondary">Naplánovat cestu</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <FiPlus size={24} aria-hidden="true" />
            </div>
          </button>

          <button 
            onClick={() => navigate('/cars')} 
            className="card card-interactive p-5 flex items-center justify-between hover-border-accent text-left group"
          >
            <div>
              <h3 className="font-bold text-lg mb-1">Moje auta</h3>
              <p className="text-sm text-secondary">Správa flotily</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <CarIcon aria-hidden="true" />
            </div>
          </button>
        </div>

        {/* Sekce Nejbližší jízda */}
        <section aria-labelledby="upcoming-ride-heading">
          <h2 id="upcoming-ride-heading" className="text-xl font-bold mb-4">Nejbližší jízda</h2>
          
          {loading ? (
             <div className="skeleton-dark h-32 rounded-xl animate-pulse w-full" aria-hidden="true"></div>
          ) : upcomingRide ? (
            <button 
              className="main-card card-interactive hover-scale-105 w-full text-left" 
              onClick={() => navigate(`/rides/${upcomingRide.id}`)}
              aria-label={`Zobrazit nejbližší jízdu: ${upcomingRide.destination}, odjezd ${formatLocalDateTime(upcomingRide.departure_time)}`}
            >
              <div className="main-card-header flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium opacity-80 mb-1">
                    {formatLocalDateTime(upcomingRide.departure_time)}
                  </div>
                  <div className="text-xl font-bold">{upcomingRide.destination}</div>
                </div>
                {upcomingRide.driver_user_id === user?.id && (
                  <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    Jsi řidič
                  </div>
                )}
              </div>
              <div className="main-card-body flex justify-between items-center">
                 <div className="text-sm">Auto: <strong className="font-semibold">{upcomingRide.car?.name || 'Neznámé'}</strong></div>
                 <span className="text-accent font-semibold text-sm">Detail →</span>
              </div>
            </button>
          ) : (
            <div className="empty-state card">
              <div className="empty-state-icon">
                <FiList size={28} aria-hidden="true" />
              </div>
              <h3 className="empty-state-title">Žádné plány</h3>
              <p className="empty-state-description">
                Zatím nemáš v dohledu žádnou jízdu.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}