import { useState, useCallback } from "react";
import { isAxiosError } from "axios";
import instance from "../api/axios";
import type { Car, CarFormData } from '../types/models';

export function useCar() {
  const [car, setCar] = useState<Car | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleError = (err: unknown, fallback: string) => {
    setError(
      isAxiosError(err)
        ? (err.response?.data?.detail ?? fallback)
        : "Nastala neočekávaná chyba."
    );
  };

  // GET /cars/ – seznam mých aut
  const fetchMyCars = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await instance.get<Car[]>('/cars/');
      setCars(res.data);
      return res.data;
    } catch (err) {
      handleError(err, 'Nepodařilo se načíst auta.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /cars/:id
  const fetchCarById = useCallback(async (carId: string) => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await instance.get<Car>(`/cars/${carId}`);
      setCar(res.data);
      return res.data;
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true);
        setCar(null);
      } else {
        handleError(err, 'Nepodařilo se načíst auto.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /cars/
  const createCar = useCallback(async (data: CarFormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.post<Car>('/cars/', data);
      setCar(res.data);
      return res.data;
    } catch (err) {
      handleError(err, 'Nepodařilo se vytvořit auto.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /cars/:id
  const updateCar = useCallback(async (carId: string, data: CarFormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.patch<Car>(`/cars/${carId}`, data);
      setCar(res.data);
      return res.data;
    } catch (err) {
      handleError(err, 'Nepodařilo se aktualizovat auto.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /cars/:id
  const deleteCar = useCallback(async (carId: string) => {
    setLoading(true);
    setError(null);
    try {
      await instance.delete(`/cars/${carId}`);
      setCar(null);
      return true;
    } catch (err) {
      handleError(err, 'Nepodařilo se smazat auto.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetState = useCallback(() => {
    setCar(null);
    setCars([]);
    setLoading(false);
    setError(null);
    setNotFound(false);
  }, []);

  return {
    car,
    cars,
    loading,
    error,
    notFound,
    fetchMyCars,
    fetchCarById,
    createCar,
    updateCar,
    deleteCar,
    resetState,
  };
}
