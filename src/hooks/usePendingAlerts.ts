import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import request from '../api/client';
import { ReminderFiredPayload } from '../types/reminders';

export interface PendingAlert {
  id: string;
  reminder_id: string;
  occurrence_key: string;
  fired_at: string;
  reminder?: {
    id: string;
    title: string;
    type: string;
    notes: string;
    family_id: string;
    pet?: { name: string; species: string } | null;
  };
}

async function fetchPendingAlerts(): Promise<PendingAlert[]> {
  return request<PendingAlert[]>('/reminders/pending-alerts');
}

interface UsePendingAlertsReturn {
  pending: PendingAlert[];
  count: number;
  isLoading: boolean;
  addFromWs: (payload: ReminderFiredPayload) => void;
  markAcked: (reminderId: string, occurrenceKey: string) => void;
  markAckedByReminder: (reminderId: string) => void;
  reload: () => Promise<void>;
}

export function usePendingAlerts(): UsePendingAlertsReturn {
  const [pending, setPending] = useState<PendingAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPendingAlerts();
      setPending(data ?? []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        reload();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [reload]);

  const addFromWs = useCallback((payload: ReminderFiredPayload) => {
    setPending((prev) => {
      const exists = prev.some(
        (p) => p.reminder_id === payload.reminder_id && p.occurrence_key === payload.occurrence_key,
      );
      if (exists) return prev;

      const newAlert: PendingAlert = {
        id: `${payload.reminder_id}_${payload.occurrence_key}`,
        reminder_id: payload.reminder_id,
        occurrence_key: payload.occurrence_key,
        fired_at: new Date().toISOString(),
        reminder: {
          id: payload.reminder_id,
          title: payload.title,
          type: payload.type,
          notes: payload.notes,
          family_id: payload.family_id,
          pet: payload.pet_name ? { name: payload.pet_name, species: '' } : null,
        },
      };
      return [newAlert, ...prev];
    });
  }, []);

  const markAcked = useCallback((reminderId: string, occurrenceKey: string) => {
    setPending((prev) =>
      prev.filter((p) => !(p.reminder_id === reminderId && p.occurrence_key === occurrenceKey)),
    );
  }, []);

  const markAckedByReminder = useCallback((reminderId: string) => {
    setPending((prev) => prev.filter((p) => p.reminder_id !== reminderId));
  }, []);

  return {
    pending,
    count: pending.length,
    isLoading,
    addFromWs,
    markAcked,
    markAckedByReminder,
    reload,
  };
}
