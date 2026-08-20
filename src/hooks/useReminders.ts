import { useState, useCallback } from 'react';
import { Reminder, CreateReminderDto, UpdateReminderDto } from '../types/reminders';
import { remindersApi } from '../api/reminders';

export function useReminders(familyId: string, petId?: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!familyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await remindersApi.getByFamily(familyId, petId);
      setReminders(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento promemoria');
    } finally {
      setIsLoading(false);
    }
  }, [familyId, petId]);

  const create = useCallback(async (dto: CreateReminderDto): Promise<Reminder> => {
    const reminder = await remindersApi.create(dto);
    setReminders((prev) => [reminder, ...prev]);
    return reminder;
  }, []);

  const update = useCallback(async (id: string, dto: UpdateReminderDto): Promise<Reminder> => {
    const updated = await remindersApi.update(id, dto);
    setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await remindersApi.delete(id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const markAcked = useCallback((reminderId: string, ackedByName: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, _lastAckedBy: ackedByName } : r)),
    );
  }, []);

  const ack = useCallback(async (id: string, occurrenceKey: string) => {
    return remindersApi.ack(id, occurrenceKey);
  }, []);

  return { reminders, isLoading, error, load, create, update, remove, ack, markAcked };
}
