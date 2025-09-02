import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from "axios";
import instance from '../api/axios';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import SeatRenderer from '../components/SeatRenderer';
import type { SeatData } from '../components/SeatRenderer';

interface Seat {
  id: number;
  position: number;
  occupied: boolean;
  user?: string;
}

interface CarData {
  layout_label: string;
  owner_name?: string;
  name?: string;
}

const axios = instance;

// Hook pro zjištění layoutu auta a dalších dat
function useCarData() {
  const [carData, setCarData] = useState<CarData | null>(null);
  
  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await axios.get('http://localhost:8000/cars/my');
        setCarData({
          layout_label: res.data.layout_label,
          owner_name: res.data.owner_name,
          name: res.data.name,
        });
      } catch {
        setCarData(null);
      }
    };
    fetchCar();
  }, []);
  
  return carData;
}

export default function SeatPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const carData = useCarData();

  const fetchSeats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/seats');
      setSeats(res.data);
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else if (err.response?.status === 401) {
          setError('Neautorizovaný přístup');
        } else {
          setError(err.response?.data?.detail || 'Neočekávaná chyba');
        }
      } else {
        setError('Síťová chyba');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSeatSelect = useCallback(async (position: number | null) => {
    if (position === null) {
      // Zrušení výběru
      setSelectedSeat(null);
      return;
    }

    try {
      // Nejdříve zkontrolujeme, jestli už nějaké sedadlo máme vybráno
      if (selectedSeat !== null) {
        await axios.delete(`http://localhost:8000/seats/${selectedSeat}`);
      }

      // Pak vyberme nové sedadlo
      await axios.post(
        `http://localhost:8000/seats/${position}`);

      setSelectedSeat(position);
      toast.success(`Sedadlo ${position} bylo úspěšně vybráno!`);
      
      // Refresh dat sedadel
      await fetchSeats();
      
    } catch (err) {
      if (isAxiosError(err)) {
        toast.error(err.response?.data?.detail || 'Chyba při výběru sedadla');
      } else {
        toast.error('Síťová chyba');
      }
    }
  }, [selectedSeat, fetchSeats]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  // Najdi aktuálně vybrané sedadlo uživatele
  useEffect(() => {
    const currentUserSeat = seats.find(seat => seat.user && seat.occupied);
    if (currentUserSeat) {
      setSelectedSeat(currentUserSeat.position);
    }
  }, [seats]);

  // Konverze dat pro SeatRenderer komponentu
  const convertSeatsForRenderer = (): SeatData[] => {
    return seats.map(seat => ({
      position: seat.position,
      position_label: seat.position.toString(),
      user_name: seat.user,
      occupied: seat.occupied,
    }));
  };

  // Normalizace layout pro SeatRenderer
  const normalizeLayout = (layout: string): string => {
    const normalized = layout.toLowerCase();
    if (normalized.includes('sedan') || normalized.includes('sedaq')) return 'SEDAQ';
    if (normalized.includes('coup') || normalized.includes('trapaq')) return 'TRAPAQ';
    if (normalized.includes('minivan') || normalized.includes('praq')) return 'PRAQ';
    return layout;
  };

  if (loading) {
    return <Loader />;
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Žádné auto nenalezeno
          </h2>
          <p className="text-yellow-700">
            Nemáte žádné aktivní auto. Nejdříve si vytvořte auto na dashboardu.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Chyba</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchSeats}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Výběr sedadla</h1>
        
        {carData && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600">
            <span className="font-medium">Auto:</span>
            <span className="bg-blue-50 px-2 py-1 rounded text-blue-900 font-mono">
              {carData.name || 'Neznámé auto'}
            </span>
            <span className="font-medium ml-4">Řidič:</span>
            <span className="bg-gray-50 px-2 py-1 rounded text-gray-900">
              {carData.owner_name || 'Neznámý řidič'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        {carData ? (
          <SeatRenderer
            layout={normalizeLayout(carData.layout_label)}
            seats={convertSeatsForRenderer()}
            selectedSeat={selectedSeat}
            onSeatSelect={handleSeatSelect}
            ownerName={carData.owner_name || 'Řidič'}
            mode="interactive"
            className="mb-6"
          />
        ) : (
          <div className="text-center py-8">
            <Loader />
            <p className="text-gray-500 mt-2">Načítání dat auta...</p>
          </div>
        )}

        {/* Informační panel */}
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Informace</h3>
          
          {selectedSeat ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded"></span>
                <span className="text-sm">Máte vybráno sedadlo #{selectedSeat}</span>
              </div>
              <button
                onClick={() => handleSeatSelect(null)}
                className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              >
                Zrušit rezervaci
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded"></span>
                <span className="text-sm text-gray-600">Nemáte vybrané žádné sedadlo</span>
              </div>
              <p className="text-xs text-gray-500">
                Klikněte na volné sedadlo pro výběr
              </p>
            </div>
          )}
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              💡 Tip: Můžete držet pouze jedno sedadlo najednou
            </p>
          </div>
        </div>

        {/* Tlačítko pro refresh */}
        <button
          onClick={fetchSeats}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Aktualizovat sedadla
        </button>
      </div>
    </div>
  );
}
