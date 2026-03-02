import { useState, useCallback } from "react";
import { isAxiosError } from "axios";
import instance from "../api/axios";
import type { Invitation } from "./useInvites";

type NotificationType = "info" | "warning" | "success" | "error" | "invite";

export type Notification = {
  id: string; // token pozvánky
  title: string;
  message: string;
  type: NotificationType;
  created_at: string;
  read: boolean;
};

function invitationToNotification(inv: Invitation): Notification {
  return {
    id: inv.token,
    title: "Nová pozvánka",
    message: `Byl/a jsi pozván/a na jízdu.`,
    type: "invite",
    created_at: inv.created_at,
    read: inv.status !== "Pending",
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, fallback: string) => {
    setError(
      isAxiosError(err)
        ? (err.response?.data?.detail ?? fallback)
        : "Nastala neočekávaná chyba."
    );
  };

  // GET /invitations/received – pending
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await instance.get<Invitation[]>("/invitations/received");
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(
        data
          .filter((i) => i.status === "Pending")
          .map(invitationToNotification)
      );
    } catch (err) {
      handleError(err, "Nepodařilo se načíst notifikace.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimistic mark as read – local state only
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
