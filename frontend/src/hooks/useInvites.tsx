import { useState, useEffect, useCallback } from "react";
import instance from "../api/axios";
import { nanoid } from "nanoid";
import { isAxiosError } from "axios";

export type Invitation = {
  email: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  created_at: Date;
  token: string;
};

export type UseInvitesReturn = {
  invites: Invitation[];
  loading: boolean;
  error: string | null;
  createInvite: (email: string) => Promise<void>;
  cancelInvite: (inviteToken: string) => Promise<void>;
  fetchInvites: () => Promise<void>;
};

export function useInvites(carId: number): UseInvitesReturn {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const axios = instance;

  const fetchInvites = useCallback(async () => {
    if (carId <= 0) return;
    try {
      setLoading(true);
      const res = await axios.get(`/cars/${carId}/invitations`);
      setInvites(res.data);
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
    if (carId <= 0) return;
    const dummyToken = nanoid()

    try {
      setError(null);

      if (!email.includes("@")) {
        setError("Zadej platný email");
        return;
      }
      if (invites.some(i => i.email.toLowerCase() === email.toLowerCase())) {
        setError("E-mail je už pozván");
        return;
      }

      const dummy: Invitation = {
        email,
        status: "PENDING",
        created_at: new Date(),
        token: dummyToken,
      };

      setInvites(prev => [...prev, dummy]);

      const res = await axios.post("/invitations", { email, car_id: carId });
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
    if (carId <= 0) return;
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

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  return { invites, loading, error, createInvite, cancelInvite, fetchInvites };
}
