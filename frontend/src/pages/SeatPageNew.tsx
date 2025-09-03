import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { isAxiosError } from 'axios';
import { FiUser, FiCalendar } from 'react-icons/fi';
import axios from '../api/axios';
import Loader from '../components/Loader';
import SeatRenderer from '../components/SeatRenderer';
import type { SeatData } from '../components/SeatRenderer';
import { useCar } from '../hooks/useCar';
import { getSeatPositionLabel } from '../utils/seatUtils';

interface User {
  id: string;
  email: string;
}

const SeatPageNew: React.FC = () => {
  const { car, loading, error, fetchPassengerCar } = useCar();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [seatLoading, setSeatLoading] = useState(false);

  // Load current user and passenger car data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userRes = await axios.get('/auth/me');
        setCurrentUser(userRes.data);
        
        // Load passenger car
        await fetchPassengerCar();
      } catch (err: unknown) {
        console.error('Error loading data:', err);
      }
    };
    
    fetchData();
  }, [fetchPassengerCar]);

  // Find user's current seat if they have one
  useEffect(() => {
    if (car?.seats && currentUser) {
      const userSeat = car.seats.find(seat => seat.user_name === currentUser.email);
      setSelectedSeat(userSeat ? userSeat.position : null);
    }
  }, [car?.seats, currentUser]);

  const handleSeatSelect = useCallback(async (seatId: number | null) => {
    if (!car || !currentUser || seatId === null) return;

    try {
      setSeatLoading(true);
      
      // Use correct seats endpoint for choosing a seat
      await axios.post(`/seats/choose`, {
        position: seatId,
      });
      
      setSelectedSeat(seatId);
      toast.success('Sedadlo bylo úspěšně vybráno!');
      
      // Refresh car data to get updated seats
      await fetchPassengerCar();
      
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message ?? "Nepodařilo se vybrat sedadlo");
      } else {
        toast.error("Nastala neočekávaná chyba");
      }
    } finally {
      setSeatLoading(false);
    }
  }, [car, currentUser, fetchPassengerCar]);

  const handleFreeSeat = useCallback(async () => {
    if (!car || !currentUser || selectedSeat === null) return;

    try {
      setSeatLoading(true);
      
      // Use correct seats endpoint for leaving a seat
      await axios.delete(`/seats/`);
      
      setSelectedSeat(null);
      toast.success('Sedadlo bylo úspěšně uvolněno!');
      
      await fetchPassengerCar();
      
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.message ?? "Nepodařilo se uvolnit sedadlo");
      } else {
        toast.error("Nastala neočekávaná chyba");
      }
    } finally {
      setSeatLoading(false);
    }
  }, [car, currentUser, selectedSeat, fetchPassengerCar]);

  if (loading || !currentUser) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FiUser className="w-8 h-8" />
            </div>
            <h2 className="empty-state-title">Chyba načítání</h2>
            <p className="empty-state-description">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FiUser className="w-8 h-8" />
            </div>
            <h2 className="empty-state-title">Žádné auto k zobrazení</h2>
            <p className="empty-state-description">
              Přijměte pozvánku na jízdu, abyste mohli vybrat sedadlo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Convert car.seats to SeatData format for SeatRenderer
  const seatData: SeatData[] = car.seats?.map(seat => ({
    position: seat.position,
    position_label: seat.position_label,
    user_name: seat.user_name,
    occupied: !!seat.user_name,
  })) || [];

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="main-card">
          <div className="main-card-header">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FiUser className="w-8 h-8" />
              Výběr sedadla
            </h1>
            <p className="text-indigo-100 mt-1">{car.name} • Řidič: {car.owner_name}</p>
          </div>
          <div className="main-card-body">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Levá karta - informace o jízdě */}
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">
                    <FiCalendar className="w-5 h-5" />
                  </div>
                  <h3 className="info-card-title">Detail jízdy</h3>
                </div>
                <div className="info-card-content">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-indigo-600 mb-1">Řidič</p>
                      <p className="text-lg font-semibold text-indigo-900">{car.owner_name}</p>
                    </div>
                    {car.date && (
                      <div>
                        <p className="text-sm font-medium text-indigo-600 mb-1">Datum a čas</p>
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                          <div className="text-2xl font-bold text-indigo-900">
                            {new Date(car.date).toLocaleString('cs-CZ', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-sm text-indigo-600 mt-1">
                            {new Date(car.date).toLocaleDateString('cs-CZ', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-indigo-600 mb-1">Vaše sedadlo</p>
                      <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                        <span className="text-lg font-bold text-indigo-900">
                          {selectedSeat ? `Pozice ${selectedSeat}` : 'Nevybráno'}
                        </span>
                        {selectedSeat && (
                          <div className="text-sm text-indigo-600 mt-1">
                            {getSeatPositionLabel(car.layout, selectedSeat)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pravá karta - výběr sedadla */}
              <div className="info-card">
                <div className="info-card-header">
                  <div className="info-card-icon">
                    <FiUser className="w-5 h-5" />
                  </div>
                  <h3 className="info-card-title">Rozložení sedadel</h3>
                </div>
                <div className="info-card-content">
                  <div className="flex items-center justify-center min-h-[320px] p-4">
                    <SeatRenderer
                      layout={car.layout}
                      seats={seatData}
                      selectedSeat={selectedSeat}
                      onSeatSelect={seatLoading ? undefined : handleSeatSelect}
                      ownerName={car.owner_name}
                      mode="interactive"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Akční tlačítka */}
            <div className="flex justify-center mt-6">
              {selectedSeat ? (
                <button
                  className="secondary-button"
                  onClick={handleFreeSeat}
                  disabled={seatLoading}
                >
                  {seatLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uvolňuji...
                    </>
                  ) : (
                    'Uvolnit sedadlo'
                  )}
                </button>
              ) : (
                <p className="text-indigo-600 text-center">Vyberte si sedadlo kliknutím na něj v rozložení výše</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatPageNew;
