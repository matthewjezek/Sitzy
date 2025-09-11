import { useEffect, useState } from 'react';
import { FiUser, FiX } from "react-icons/fi";
import { isAxiosError } from 'axios';
import instance from '../api/axios';
import { useCar, type Car } from '../hooks/useCar';
import Loader from '../components/Loader';

interface User {
  id: string;
  email: string;
  created_at: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { car, fetchMyCar, fetchPassengerCar } = useCar();
  const [ownCar, setOwnCar] = useState<Car | null>(null);

  useEffect(() => {
    const axios = instance;

    setLoading(true);
    
    const loadData = async () => {
      try {
        // Načteme uživatelská data
        const userRes = await axios.get('/auth/me');
        setUser(userRes.data);

        // Načteme vlastní auto pro zobrazení názvu
        try {
          const myCar = await fetchMyCar();
          setOwnCar(myCar);
        } catch (err: unknown) {
          if (isAxiosError(err)) {
            console.log(err.response?.data?.message ?? "Nepodařilo se načíst vlastní auto");
          } else {
            console.log("Nastala neočekávaná chyba");
          }
          setOwnCar(null);
        }

        // Načteme auto kde je uživatel pasažérem (pro kontrolu sedadla)
        try {
          await fetchPassengerCar();
        } catch (err: unknown) {
          if (isAxiosError(err)) {
            console.log(err.response?.data?.message ?? "Nepodařilo se načíst auto, kde je uživatel pasažérem");
          } else {
            console.log("Nastala neočekávaná chyba");
          }
        }

      } catch (err: unknown) {
        if (isAxiosError(err)) {
          console.log(err.response?.data?.message ?? "Nepodařilo se načíst data");
        } else {
          console.log("Nastala neočekávaná chyba");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchMyCar, fetchPassengerCar]);

  // Najdeme pozici uživatele v autě kde je pasažérem
  const userSeat = car?.seats?.find(seat => seat.user_name === user?.email);

  if (loading) {
    return <Loader />;
  }

  return(
    <div className="page-container">
      <div className="page-content">
        <div className="main-card">
          <div className="main-card-header">
            <h1>Nastavení</h1>
          </div>
          <div className="main-card-body">
            <div className="settings-section">
              <div className="settings-section-header">
                <FiUser size={20} className="text-indigo-500" />
                <h2 className="settings-section-title">Profil</h2>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ID">ID</label>
                <input
                  className="form-input"
                  type="text"
                  value={user?.id || ''}
                  readOnly
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="created_at">Datum vytvoření</label>
                <input
                  className="form-input"
                  type="text"
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString('cs-CZ') : ''}
                  readOnly
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">E-mail</label>
                <input
                  className="form-input"
                  type="text"
                  value={user?.email || ''}
                  readOnly
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">Heslo</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  readOnly
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="car_name">Auto</label>
                <input
                  className="form-input"
                  type="text"
                  value={ownCar?.name || 'Žádné auto'}
                  readOnly
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="passenger">Je pasažérem?</label>
                <div className="form-input flex items-center">
                  {userSeat ? (
                    <span className="text-green-600">
                      Ano - pozice {userSeat.position}
                    </span>
                  ) : car ? (
                    <span className="text-blue-600">
                      Ano - bez přiřazeného sedadla
                    </span>
                  ) : (
                    <span className="flex items-center text-red-500">
                      <FiX className="mr-1" />
                      Ne
                    </span>
                  )}
                </div>
              </div>
              <button className="primary-button mt-4" type="submit">Uložit změny</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}