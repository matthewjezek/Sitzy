import { useState, useCallback, useEffect } from "react";
import axios, { isAxiosError } from "axios";

export type Invitation = {
  email: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  created_at: Date;
  token: string;
};

export function useInviteNotifications() {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<Invitation[]>("/invites/pending");
      setInvites(res.data);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Nepodařilo se načíst pozvánky");
      } else {
        setError("Nastala neočekávaná chyba");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  return { invites, setInvites, loading, error, fetchInvites };
}
