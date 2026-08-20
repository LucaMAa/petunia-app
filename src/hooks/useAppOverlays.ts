import { useState, useEffect, useCallback } from 'react';
import { familiesApi } from '../api/families';
import { remindersApi } from '../api/reminders';
import { useInvites } from './useInvites';
import { useWebSocket } from './useWebSocket';
import { usePendingAlerts } from './usePendingAlerts';
import { FamilyInvite } from '../types';
import { ReminderFiredPayload, ReminderAckedPayload } from '../types/reminders';

export interface AppOverlaysState {
  invites: FamilyInvite[];
  handleAccept: (invite: FamilyInvite) => Promise<void>;
  handleDecline: (invite: FamilyInvite) => Promise<void>;

  firedReminder: ReminderFiredPayload | null;
  ackedReminder: ReminderAckedPayload | null;
  dismissFired: () => void;
  dismissAcked: () => void;
  ackFiredReminder: (occurrenceKey: string) => Promise<void>;

  pendingAlerts: ReturnType<typeof usePendingAlerts>['pending'];
  pendingCount: number;
  alertsLoading: boolean;
  showPendingAlerts: boolean;
  openPendingAlerts: () => void;
  closePendingAlerts: () => void;
  markAlertAcked: (reminderId: string, occurrenceKey: string) => void;
  reloadAlerts: () => Promise<void>;

  wsRef: ReturnType<typeof useWebSocket>['wsRef'];

  petRefreshKey: number;
}

export function useAppOverlays(): AppOverlaysState {
  const [petRefreshKey, setPetRefreshKey] = useState(0);
  const [firedReminder, setFiredReminder] = useState<ReminderFiredPayload | null>(null);
  const [ackedReminder, setAckedReminder] = useState<ReminderAckedPayload | null>(null);
  const [showPendingAlerts, setShowPendingAlerts] = useState(false);

  const { invites, load: loadInvites, addInvite, removeInvite } = useInvites();

  const {
    pending: pendingAlerts,
    count: pendingCount,
    addFromWs: addPendingFromWs,
    markAcked: markAlertAcked,
    markAckedByReminder,
    reload: reloadAlerts,
    isLoading: alertsLoading,
  } = usePendingAlerts();

  useEffect(() => {
    loadInvites();
  }, []);

  const { wsRef } = useWebSocket((msg) => {
    if (msg.event === 'family_invite') {
      const p = msg.payload as FamilyInvite & {
        invite_id: number;
        family_name: string;
        inviter_name: string;
      };
      addInvite({
        id: p.invite_id,
        family_id: p.family_id,
        inviter_id: p.inviter_id,
        invitee_id: '',
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: '',
        family: { id: p.family_id, name: p.family_name, created_at: '', updated_at: '' },
        inviter: {
          id: p.inviter_id,
          first_name: p.inviter_name,
          last_name: '',
          email: '',
          status: 'enabled',
          created_at: '',
          updated_at: '',
        },
      });
    }

    if (msg.event === 'reminder_fired') {
      const p = msg.payload as ReminderFiredPayload;
      setFiredReminder(p);
      addPendingFromWs(p);
    }

    if (msg.event === 'reminder_acked') {
      const p = msg.payload as ReminderAckedPayload;
      setFiredReminder((prev) => (prev?.reminder_id === p.reminder_id ? null : prev));
      setAckedReminder(p);
      try {
        if (p.occurrence_key) {
          markAlertAcked(p.reminder_id, p.occurrence_key);
        } else {
          markAckedByReminder(p.reminder_id);
        }
        reloadAlerts().catch(() => {});
      } catch (e) {}
    }
  });

  const handleAccept = useCallback(
    async (invite: FamilyInvite) => {
      await familiesApi.respondToInvite(invite.id, true);
      removeInvite(invite.id);
      setPetRefreshKey((k) => k + 1);
    },
    [removeInvite],
  );

  const handleDecline = useCallback(
    async (invite: FamilyInvite) => {
      await familiesApi.respondToInvite(invite.id, false);
      removeInvite(invite.id);
    },
    [removeInvite],
  );

  const ackFiredReminder = useCallback(
    async (occurrenceKey: string) => {
      if (!firedReminder) return;
      await remindersApi.ack(firedReminder.reminder_id, occurrenceKey);
      markAlertAcked(firedReminder.reminder_id, occurrenceKey);
    },
    [firedReminder, markAlertAcked],
  );

  return {
    invites,
    handleAccept,
    handleDecline,
    firedReminder,
    ackedReminder,
    dismissFired: () => setFiredReminder(null),
    dismissAcked: () => setAckedReminder(null),
    ackFiredReminder,
    pendingAlerts,
    pendingCount,
    alertsLoading,
    showPendingAlerts,
    openPendingAlerts: () => setShowPendingAlerts(true),
    closePendingAlerts: () => setShowPendingAlerts(false),
    markAlertAcked,
    reloadAlerts,
    wsRef,
    petRefreshKey,
  };
}
