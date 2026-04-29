import { useState, useEffect, useCallback } from "react";
import { isAxiosError } from "axios";
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
  createInvite: (email: string) => Promise<void>;
  cancelInvite: (token: string) => Promise<void>;
  respondInvite: (token: string, accept: boolean) => Promise<void>;
  fetchInvites: () => Promise<void>;
}

export function useInvites(rideId?: string): UseInvitesReturn {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isGlobalInbox = rideId === undefined;

  const handleError = (err: unknown, fallback: string) => {
    setError(
      isAxiosError(err)
        ? (err.response?.data?.detail ?? fallback)
        : "Nastala neočekávaná chyba."
    );
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

  useEffect(() => {
    if (!isGlobalInbox) return;

    const handleRefresh = () => {
      void fetchInvites();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchInvites();
      }
    };

    const intervalId = window.setInterval(handleRefresh, 30000);

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchInvites, isGlobalInbox]);

  // POST /rides/:rideId/invite
  const createInvite = useCallback(async (email: string) => {
    if (!rideId) return;
    setError(null);

    if (invites.some((i) => i.invited_email.toLowerCase() === email.toLowerCase())) {
      setError("Tento e-mail je již pozván.");
      return;
    }

    try {
      const res = await instance.post<Invitation>(`/rides/${rideId}/invite`, {
        invited_email: email,
      });
      setInvites((prev) => [...prev, res.data]);
      notifyInvitesChanged(rideId);
    } catch (err) {
      handleError(err, "Nepodařilo se vytvořit pozvánku.");
    }
  }, [rideId, invites]);

  // DELETE /invitations/:token
  const cancelInvite = useCallback(async (token: string) => {
    setError(null);
    try {
      await instance.delete(`/invitations/${token}`);
      setInvites((prev) => prev.filter((i) => i.token !== token));
      notifyInvitesChanged(rideId);
    } catch (err) {
      handleError(err, "Nepodařilo se zrušit pozvánku.");
    }
  }, []);

  // POST /invitations/:token/accept|reject
  const respondInvite = useCallback(async (token: string, accept: boolean) => {
    setError(null);
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
      // Backend accept endpoint expects an optional body model.
      await instance.post(endpoint, {});
      setInvites((prev) => prev.filter((i) => i.token !== token));
      notifyInvitesChanged(rideId);
    } catch (err) {
      // Rollback
      setInvites((prev) =>
        prev.map((i) =>
          i.token === token ? { ...i, status: "Pending" } : i
        )
      );
      handleError(err, "Nepodařilo se odpovědět na pozvánku.");
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  return { invites, loading, error, createInvite, cancelInvite, respondInvite, fetchInvites };
}
