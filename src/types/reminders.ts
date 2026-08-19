export type ReminderType = 'medicine' | 'food' | 'other';
export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'custom';

export interface Reminder {
  id: string;
  family_id: string;
  pet_id?: string;
  created_by: string;
  type: ReminderType;
  title: string;
  notes: string;
  repeat: ReminderRepeat;
  cron_expr?: string;
  scheduled_at?: string | null;
  time_of_day?: string;
  day_of_week?: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  pet?: { id: string; name: string; species: string };
  _lastAckedBy?: string;
}

export interface CreateReminderDto {
  family_id: string;
  pet_id?: string;
  type: ReminderType;
  title: string;
  notes?: string;
  repeat?: ReminderRepeat;
  cron_expr?: string;
  scheduled_at?: string | null;
  time_of_day?: string;
  day_of_week?: number | null;
}

export interface UpdateReminderDto {
  title: string;
  notes?: string;
  repeat?: ReminderRepeat;
  cron_expr?: string;
  scheduled_at?: string | null;
  time_of_day?: string;
  day_of_week?: number | null;
  enabled: boolean;
}

export interface ReminderFiredPayload {
  reminder_id: string;
  occurrence_key: string;
  type: ReminderType;
  title: string;
  notes: string;
  pet_name: string;
  family_id: string;
}

export interface ReminderAckedPayload {
  reminder_id: string;
  occurrence_key: string;
  title: string;
  type: ReminderType;
  acked_by_name: string;
  family_id: string;
}
