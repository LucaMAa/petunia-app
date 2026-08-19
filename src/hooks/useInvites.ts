import { useState, useCallback } from 'react';
import { FamilyInvite } from '../types';
import { familiesApi } from '../api/families';

export function useInvites() {
  const [invites, setInvites] = useState<FamilyInvite[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await familiesApi.getPendingInvites();
      setInvites(data ?? []);
    } catch {}
  }, []);

  const addInvite = useCallback((invite: FamilyInvite) => {
    setInvites(prev => {
      if (prev.some(i => i.id === invite.id)) return prev;
      return [invite, ...prev];
    });
  }, []);

  const removeInvite = useCallback((id: number) => {
    setInvites(prev => prev.filter(i => i.id !== id));
  }, []);

  return { invites, load, addInvite, removeInvite };
}
