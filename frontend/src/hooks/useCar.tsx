import { useState, useCallback } from "react";
import instance from "../api/axios";
import { isAxiosError } from "axios";
import type { SeatData } from "../components/SeatRenderer";

// Základní typ pro auto
export interface Car {
  id: string;
  owner_id: string;
  name: string;
  date?: string;
  layout: string;
  layout_label?: string;
  owner_name?: string;
  seats?: SeatData[];
  invitations?: Array<{
    id: string;
    invited_email: string;
    status_label: string;
  }>;
}

// Hook pro správu aut
export function useCar() {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  const axios = instance;

  // Načítání vlastního auta
  const fetchMyCar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    
    try {
      const res = await axios.get('/cars/my');
      setCar(res.data);
      return res.data;
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true);
        setCar(null);
      } else {
        setError(isAxiosError(err) 
          ? err.response?.data?.message ?? "Nepodařilo se načíst auto"
          : "Nastala neočekávaná chyba"
        );
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [axios]);

  // Načítání auta, kde jsem cestujícím
  const fetchPassengerCar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    
    try {
      const res = await axios.get('/cars/as-passenger');
      if (res.data) {
        setCar(res.data);
        return res.data;
      } else {
        setNotFound(true);
        setCar(null);
        return null;
      }
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true);
        setCar(null);
      } else {
        setError(isAxiosError(err) 
          ? err.response?.data?.message ?? "Nepodařilo se načíst auto"
          : "Nastala neočekávaná chyba"
        );
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [axios]);

  // Načítání konkrétního auta podle ID
  const fetchCarById = useCallback(async (carId: string) => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    
    try {
      const res = await axios.get(`/cars/${carId}`);
      const carData = res.data;
      setCar(carData);
      return carData;
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true);
        setCar(null);
      } else {
        setError(isAxiosError(err) 
          ? err.response?.data?.message ?? "Nepodařilo se načíst auto"
          : "Nastala neočekávaná chyba"
        );
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [axios]);

  // Vytvoření nového auta
  const createCar = useCallback(async (carData: {
    name: string;
    layout: string;
    date: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post('/cars/', carData);
      const newCar = res.data;
      setCar(newCar);
      return newCar;
    } catch (err: unknown) {
      setError(isAxiosError(err) 
        ? err.response?.data?.message ?? "Nepodařilo se vytvořit auto"
        : "Nastala neočekávaná chyba"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [axios]);

  // Aktualizace auta
  const updateCar = useCallback(async (carId: string, carData: {
    name: string;
    layout: string;
    date: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.patch(`/cars/${carId}`, carData);
      const updatedCar = res.data;
      setCar(updatedCar);
      return updatedCar;
    } catch (err: unknown) {
      setError(isAxiosError(err) 
        ? err.response?.data?.message ?? "Nepodařilo se aktualizovat auto"
        : "Nastala neočekávaná chyba"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, [axios]);

  // Smazání auta
  const deleteCar = useCallback(async (carId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/cars/${carId}`);
      setCar(null);
      return true;
    } catch (err: unknown) {
      setError(isAxiosError(err) 
        ? err.response?.data?.message ?? "Nepodařilo se smazat auto"
        : "Nastala neočekávaná chyba"
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [axios]);

  // Resetování stavu
  const resetState = useCallback(() => {
    setCar(null);
    setLoading(false);
    setError(null);
    setNotFound(false);
  }, []);

  return {
    car,
    loading,
    error,
    notFound,
    fetchMyCar,
    fetchPassengerCar,
    fetchCarById,
    createCar,
    updateCar,
    deleteCar,
    resetState,
  };
}
