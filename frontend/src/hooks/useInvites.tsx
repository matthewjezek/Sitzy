import { useState, useEffect, useCallback } from "react";
import instance from "../api/axios";
import { nanoid } from "nanoid";
import { isAxiosError } from "axios";

export type Invitation = {
  invited_email: string;
  status: "Pending" | "Accepted" | "Rejected";
  created_at: Date;
  token: string;
  car_id: string;
};

export type UseInvitesReturn = {
  invites: Invitation[];
  loading: boolean;
  error: string | null;
  createInvite: (email: string) => Promise<void>;
  cancelInvite: (inviteToken: string) => Promise<void>;
  respondInvite: (inviteToken: string, accept: boolean) => Promise<void>;
  fetchInvites: () => Promise<void>;
};

export function useInvites(carId?: string): UseInvitesReturn {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  
  const axios = instance;

  // Načtení aktuálního uživatele
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get('/auth/me');
        setCurrentUserEmail(res.data?.email || null);
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          setError(err.response?.data?.message ?? "Nepodařilo se načíst aktuálního uživatele");
        } else {
          setError("Nastala neočekávaná chyba");
        }
      }
    };
    fetchCurrentUser();
  }, [axios]);

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true);
      const url = carId
        ? `/cars/${carId}/invitations`
        : `/invitations/received`
      const res = await axios.get(url);
      // Pokud taháme pozvánky pro aktuálního uživatele (bez carId), zobrazujeme jen čekající
      // Přijaté/Odmítnuté by se neměly objevovat v notifikacích
      const data = Array.isArray(res.data) ? res.data : [];
      setInvites(
        carId
          ? data
          : data.filter((i: { status?: string }) => i?.status === "Pending")
      );
      setError(null);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Nepodařilo se vytvořit pozvánku");
      } else {
        setError("Nastala neočekávaná chyba");
      }
    } finally {
      setLoading(false);
    }
  }, [carId, axios]);

  const createInvite = async (email: string) => {
    if (!carId) return;
    const dummyToken = nanoid()

    try {
      setError(null);

      if (!email.includes("@")) {
        setError("Zadej platný email");
        return;
      }
      if (invites.some(i => i.invited_email.toLowerCase() === email.toLowerCase())) {
        setError("E-mail je už pozván");
        return;
      }
      if (currentUserEmail && email.toLowerCase() === currentUserEmail.toLowerCase()) {
        setError("Nemůžete pozvat sebe sama");
        return;
      }

      const dummy: Invitation = {
        invited_email: email,
        status: "Pending",
        created_at: new Date(),
        token: dummyToken,
        car_id: carId,
      };

      setInvites(prev => [...prev, dummy]);

      const localDate = new Date(); // lokální čas
      const dateWithSeconds = localDate.toISOString(); // UTC ISO string

      const res = await axios.post(`/cars/${carId}/invite`, { invited_email: email, car_id: carId, created_at: dateWithSeconds });
      const realInvite: Invitation = res.data;

      setInvites(prev =>
        prev.map(inv => (inv.token === dummyToken ? realInvite : inv))
      );
    } catch (err: unknown) {
      setInvites(prev => prev.filter(inv => inv.token !== dummyToken));

      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Nepodařilo se vytvořit pozvánku");
      } else {
        setError("Nastala neočekávaná chyba");
      }
    }
  };

  const cancelInvite = async (inviteToken: string) => {
    if (!carId) return;
    if (!invites.some(inv => inv.token === inviteToken)) {
      setError("Pozvánka už není platná.");
      return;
    }

    try {
      await axios.delete(`/invitations/${inviteToken}`);
      setInvites((prev) => prev.filter((i) => i.token !== inviteToken));
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Nepodařilo se vytvořit pozvánku");
      } else {
        setError("Nastala neočekávaná chyba");
      }
    }
  };

  const respondInvite = async (inviteToken: string, accept: boolean) => {
    try {
      const endpoint = accept
        ? `/invitations/${inviteToken}/accept`
        : `/invitations/${inviteToken}/reject`;
      console.log('Calling endpoint:', endpoint, 'Method: POST');
      setInvites(prev =>
        prev.map(inv =>
          inv.token === inviteToken ? { ...inv, status: accept ? "Accepted" : "Rejected" } : inv
        )
      );
      await axios.post(endpoint);
      setInvites(prev => prev.filter(i => i.token !== inviteToken));
    } catch (err: unknown) {
      setInvites(prev =>
        prev.map(inv => 
          inv.token === inviteToken ? { ...inv, status: "Pending" } : inv
        )
      );

      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Nepodařilo se odpovědět na pozvánku");
      } else {
        setError("Nastala neočekávaná chyba");
      }
    }
  }

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  return { invites, loading, error, createInvite, cancelInvite, respondInvite, fetchInvites };
}
