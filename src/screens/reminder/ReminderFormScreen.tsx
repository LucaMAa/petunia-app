import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform, TextInput as RNTextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalization } from '../../context/LocalizationContext';
import { Reminder, CreateReminderDto, UpdateReminderDto, ReminderType, ReminderRepeat } from '../../types/reminders';
import { Pet } from '../../types';
import { useReminders } from '../../hooks/useReminders';
import { TextInput } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';

interface Props {
  familyId: string;
  pets: Pet[];
  existingReminder?: Reminder;
  preselectedPetId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TYPE_OPTIONS: { value: ReminderType; emoji: string; label: string }[] = [
  { value: 'medicine', emoji: '💊', label: 'Medicina' },
  { value: 'food',     emoji: '🍽',  label: 'Cibo'     },
  { value: 'other',    emoji: '🔔', label: 'Altro'    },
];

const REPEAT_OPTIONS: { value: ReminderRepeat; label: string; icon: string }[] = [
  { value: 'none',   label: 'Una volta',      icon: '1️⃣' },
  { value: 'daily',  label: 'Ogni giorno',    icon: '📅' },
  { value: 'weekly', label: 'Ogni settimana', icon: '🗓' },
  { value: 'custom', label: 'Cron custom',    icon: '⚙️' },
];

const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

interface FormState {
  type: ReminderType;
  title: string;
  notes: string;
  repeat: ReminderRepeat;
  time_of_day: string;
  day_of_week: number;
  scheduled_at: string;
  cron_expr: string;
  pet_id: string;
  enabled: boolean;
}

function initialState(r?: Reminder, preselectedPetId?: string): FormState {
  return {
    type:         (r?.type    ?? 'medicine') as ReminderType,
    title:        r?.title    ?? '',
    notes:        r?.notes    ?? '',
    repeat:       (r?.repeat  ?? 'daily')    as ReminderRepeat,
    pet_id:       r?.pet?.id  ?? preselectedPetId ?? '',
    time_of_day:  r?.time_of_day  ?? '08:00',
    day_of_week:  r?.day_of_week  ?? 1,
    scheduled_at: r?.scheduled_at ?? '',
    cron_expr:    r?.cron_expr    ?? '',
    enabled:      r?.enabled      ?? true,
  };
}

export function ReminderFormScreen({
  familyId, pets, preselectedPetId, existingReminder, onSuccess, onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const isEditing = !!existingReminder;
  const { create, update } = useReminders(familyId);
  const { t } = useLocalization();

  const [form, setForm]     = useState<FormState>(initialState(existingReminder, preselectedPetId));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [error, setError]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function set<K extends keyof FormState>(key: K) {
    return (value: FormState[K]) => {
      setForm(p => ({ ...p, [key]: value }));
      setErrors(p => ({ ...p, [key]: undefined }));
    };
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Il titolo è obbligatorio';
    if ((form.repeat === 'daily' || form.repeat === 'weekly') &&
        !/^\d{2}:\d{2}$/.test(form.time_of_day)) {
      e.time_of_day = 'Formato HH:MM (es. 08:30)';
    }
    if (form.repeat === 'none' && !form.scheduled_at) {
      e.scheduled_at = 'Inserisci data e ora';
    }
    if (form.repeat === 'custom' && !form.cron_expr.trim()) {
      e.cron_expr = 'Inserisci espressione cron';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsLoading(true);
    setError(null);
    try {
      if (isEditing) {
        const dto: UpdateReminderDto = {
          title:        form.title.trim(),
          notes:        form.notes.trim(),
          repeat:       form.repeat,
          time_of_day:  form.repeat === 'daily' || form.repeat === 'weekly' ? form.time_of_day : undefined,
          day_of_week:  form.repeat === 'weekly' ? form.day_of_week : undefined,
          scheduled_at: form.repeat === 'none' ? form.scheduled_at || null : null,
          cron_expr:    form.repeat === 'custom' ? form.cron_expr.trim() : undefined,
          enabled:      form.enabled,
        };
        await update(existingReminder!.id, dto);
      } else {
        const dto: CreateReminderDto = {
          family_id:    familyId,
          pet_id:       form.pet_id || undefined,
          type:         form.type,
          title:        form.title.trim(),
          notes:        form.notes.trim(),
          repeat:       form.repeat,
          time_of_day:  form.repeat === 'daily' || form.repeat === 'weekly' ? form.time_of_day : undefined,
          day_of_week:  form.repeat === 'weekly' ? form.day_of_week : undefined,
          scheduled_at: form.repeat === 'none' ? form.scheduled_at || null : null,
          cron_expr:    form.repeat === 'custom' ? form.cron_expr.trim() : undefined,
        };
        await create(dto);
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Qualcosa è andato storto');
    } finally {
      setIsLoading(false);
    }
  }

  const lockedPet = preselectedPetId
    ? pets.find(p => p.id === preselectedPetId)
    : undefined;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>{t('cancel','Annulla')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? t('edit_reminder','Modifica promemoria') : t('new_reminder','Nuovo promemoria')}
          </Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ErrorBanner message={error} />

          {/* TIPO */}
          <Text style={styles.label}>{'Tipo *'}</Text>
          <View style={styles.row}>
            {TYPE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => set('type')(opt.value)}
                style={[styles.chip, form.type === opt.value && styles.chipSelected]}
              >
                <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                <Text style={[styles.chipLabel, form.type === opt.value && styles.chipLabelSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TITOLO */}
          <TextInput
            label="Titolo *"
            placeholder="Es. Antibiotico mattina"
            value={form.title}
            onChangeText={set('title')}
            error={errors.title}
          />

          {/* NOTE — custom multiline, not the animated TextInput */}
          <View style={styles.notesWrapper}>
            <Text style={styles.label}>{'Note'}</Text>
            <RNTextInput
              style={styles.notesInput}
              placeholder="Dettagli aggiuntivi…"
              placeholderTextColor={colors.textMuted}
              value={form.notes}
              onChangeText={set('notes')}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* ANIMALE */}
          {pets.length > 0 && (
            <>
              <Text style={styles.label}>{'Animale (opzionale)'}</Text>
              {lockedPet ? (
                <View style={styles.petLocked}>
                  <Text style={styles.petLockedEmoji}>{'🐾'}</Text>
                  <Text style={styles.petLockedText}>{lockedPet.name}</Text>
                  <Text style={styles.petLockedHint}>{'(pre-selezionato)'}</Text>
                </View>
              ) : (
                <View style={styles.row}>
                  <TouchableOpacity
                    onPress={() => set('pet_id')('')}
                    style={[styles.chip, form.pet_id === '' && styles.chipSelected]}
                  >
                    <Text style={styles.chipLabel}>{'Nessuno'}</Text>
                  </TouchableOpacity>
                  {pets.map(pet => (
                    <TouchableOpacity
                      key={pet.id}
                      onPress={() => set('pet_id')(pet.id)}
                      style={[styles.chip, form.pet_id === pet.id && styles.chipSelected]}
                    >
                      <Text style={styles.chipEmoji}>{'🐾'}</Text>
                      <Text style={[styles.chipLabel, form.pet_id === pet.id && styles.chipLabelSelected]}>
                        {pet.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* RIPETIZIONE */}
          <Text style={styles.label}>{'Ripetizione *'}</Text>
          <View style={styles.repeatGrid}>
            {REPEAT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => set('repeat')(opt.value)}
                style={[styles.repeatChip, form.repeat === opt.value && styles.repeatChipSelected]}
              >
                <Text style={styles.repeatIcon}>{opt.icon}</Text>
                <Text style={[styles.repeatLabel, form.repeat === opt.value && styles.repeatLabelSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ORARIO */}
          {(form.repeat === 'daily' || form.repeat === 'weekly') && (
            <TextInput
              label="Orario *"
              placeholder="08:30"
              value={form.time_of_day}
              onChangeText={set('time_of_day')}
              keyboardType="numbers-and-punctuation"
              error={errors.time_of_day}
            />
          )}

          {/* GIORNO SETTIMANA */}
          {form.repeat === 'weekly' && (
            <>
              <Text style={styles.label}>{'Giorno della settimana'}</Text>
              <View style={styles.row}>
                {DAYS.map((day, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => set('day_of_week')(i)}
                    style={[styles.dayChip, form.day_of_week === i && styles.dayChipSelected]}
                  >
                    <Text style={[styles.dayLabel, form.day_of_week === i && styles.dayLabelSelected]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* DATA/ORA */}
          {form.repeat === 'none' && (
            <TextInput
              label="Data e ora *"
              placeholder="2025-12-31T08:00:00"
              value={form.scheduled_at}
              onChangeText={set('scheduled_at')}
              hint="Formato ISO: YYYY-MM-DDTHH:MM:SS"
              error={errors.scheduled_at}
            />
          )}

          {/* CRON */}
          {form.repeat === 'custom' && (
            <TextInput
              label="Espressione Cron *"
              placeholder="0 8 * * 1"
              value={form.cron_expr}
              onChangeText={set('cron_expr')}
              autoCapitalize="none"
              hint="Es: '0 8 * * 1' = ogni lunedi alle 8:00"
              error={errors.cron_expr}
            />
          )}

          <Button
            label={isEditing ? 'Salva modifiche' : 'Crea promemoria'}
            onPress={handleSubmit}
            loading={isLoading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  flex:   { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText:  { ...typography.body, fontWeight: '600', color: colors.primary },
  headerTitle: { ...typography.h3 },

  container: { padding: spacing.lg, gap: spacing.md },

  label: { ...typography.label, marginTop: spacing.xs },

  row:        { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected:      { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipEmoji:         { fontSize: 14 },
  chipLabel:         { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  chipLabelSelected: { color: colors.primaryDeep },
  notesWrapper: { gap: 6 },
  notesInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  repeatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  repeatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  repeatChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    ...shadow.xs,
  },
  repeatIcon:         { fontSize: 16 },
  repeatLabel:        { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  repeatLabelSelected:{ color: colors.primaryDeep },
  dayChip: {
    width: 40, height: 40,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  dayLabel:        { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  dayLabelSelected:{ color: colors.textOnPrimary },
  petLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryMid,
    alignSelf: 'flex-start',
  },
  petLockedEmoji: { fontSize: 16 },
  petLockedText:  { ...typography.bodyMedium, color: colors.primaryDeep },
  petLockedHint:  { ...typography.caption, color: colors.textMuted },
});
