import { useState, useCallback } from "react";
import axios, { isAxiosError } from "axios";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error" | "invite";
  created_at: Date;
  read: boolean;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<Notification[]>("/notifications");
      setNotifications(res.data);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Nepodařilo se načíst notifikace");
      } else {
        setError("Nastala neočekávaná chyba");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await axios.post(`/notifications/${id}/read`);
    } catch {
      // fallback: vrátit zpět
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const prev = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await axios.post("/notifications/read-all");
    } catch {
      setNotifications(prev);
    }
  }, [notifications]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
