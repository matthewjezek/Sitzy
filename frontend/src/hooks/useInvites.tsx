import { useState, useEffect, useCallback } from "react";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";
import instance from "../api/axios";

import type { Invitation } from '../types/models';

export const INVITES_CHANGED_EVENT = 'invites:changed';

type InvitesChangedDetail = {
  rideId?: string;
};

export function notifyInvitesChanged(rideId?: string) {
  window.dispatchEvent(new CustomEvent<InvitesChangedDetail>(INVITES_CHANGED_EVENT, {
    detail: { rideId },
  }));
}

export interface UseInvitesReturn {
  invites: Invitation[];
  loading: boolean;
  error: string | null;
  createInvite: (email: string) => Promise<boolean>;
  cancelInvite: (token: string) => Promise<boolean>;
  respondInvite: (token: string, accept: boolean) => Promise<void>;
  fetchInvites: () => Promise<void>;
}

export function useInvites(rideId?: string): UseInvitesReturn {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, fallback: string) => {
    setError(
      isAxiosError(err)
        ? (err.response?.data?.detail ?? fallback)
        : "Nastala neočekávaná chyba."
    );
  };

  const toastError = (err: unknown, fallback: string) => {
    const msg = isAxiosError(err)
      ? (err.response?.data?.detail ?? fallback)
      : "Nastala neočekávaná chyba.";
    toast.error(msg);
  };

  // GET /invitations/ride/:rideId  nebo  GET /invitations/received
  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = rideId
        ? `/invitations/ride/${rideId}`
        : `/invitations/received`;
      const res = await instance.get<Invitation[]>(url);
      const data = Array.isArray(res.data) ? res.data : [];
      setInvites(data.filter((i) => i.status === "Pending"));
    } catch (err) {
      handleError(err, "Nepodařilo se načíst pozvánky.");
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    const handleInvitesChanged = (event: Event) => {
      const customEvent = event as CustomEvent<InvitesChangedDetail>;
      const changedRideId = customEvent.detail?.rideId;

      if (rideId && changedRideId && rideId !== changedRideId) {
        return;
      }

      void fetchInvites();
    };

    window.addEventListener(INVITES_CHANGED_EVENT, handleInvitesChanged);
    return () => window.removeEventListener(INVITES_CHANGED_EVENT, handleInvitesChanged);
  }, [fetchInvites, rideId]);

  // POST /rides/:rideId/invite
  const createInvite = useCallback(async (email: string) => {
    if (!rideId) return false;

    if (invites.some((i) => i.invited_email.toLowerCase() === email.toLowerCase())) {
      toast.error("Tento e-mail je již pozván.");
      return false;
    }

    try {
      const res = await instance.post<Invitation>(`/rides/${rideId}/invite`, {
        invited_email: email,
      });
      setInvites((prev) => [...prev, res.data]);
      notifyInvitesChanged(rideId);
      return true;
    } catch (err) {
      toastError(err, "Nepodařilo se vytvořit pozvánku.");
      return false;
    }
  }, [rideId, invites]);

  // DELETE /invitations/:token
  const cancelInvite = useCallback(async (token: string) => {
    try {
      await instance.delete(`/invitations/${token}`);
      setInvites((prev) => prev.filter((i) => i.token !== token));
      notifyInvitesChanged(rideId);
      return true;
    } catch (err) {
      toastError(err, "Nepodařilo se zrušit pozvánku.");
      return false;
    }
  }, [rideId]);

  // POST /invitations/:token/accept|reject
  const respondInvite = useCallback(async (token: string, accept: boolean) => {
    // Optimistic update
    setInvites((prev) =>
      prev.map((i) =>
        i.token === token
          ? { ...i, status: accept ? "Accepted" : "Rejected" }
          : i
      )
    );
    try {
      const endpoint = accept
        ? `/invitations/${token}/accept`
        : `/invitations/${token}/reject`;
      await instance.post(endpoint, {});
      setInvites((prev) => prev.filter((i) => i.token !== token));
      notifyInvitesChanged(rideId);
    } catch (err) {
      setInvites((prev) =>
        prev.map((i) =>
          i.token === token ? { ...i, status: "Pending" } : i
        )
      );
      toastError(err, "Nepodařilo se odpovědět na pozvánku.");
      throw err;
    }
  }, [rideId]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  return { invites, loading, error, createInvite, cancelInvite, respondInvite, fetchInvites };
}
