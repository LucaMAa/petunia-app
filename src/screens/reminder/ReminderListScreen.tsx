import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Switch, RefreshControl, Alert,
} from 'react-native';
import { useAlert } from '../../components/ui/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Reminder } from '../../types/reminders';
import { useReminders } from '../../hooks/useReminders';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';
import { useLocalization } from '../../context/LocalizationContext';
import { Avatar } from '../../components/ui/Avatar';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { Button } from '../../components/ui/Button';

interface Props {
  familyId: string;
  familyName: string;
  petId?: string;
  petName?: string;
  onBack: () => void;
  onCreateReminder: () => void;
  onEditReminder: (reminder: Reminder) => void;
  onOpenAckHistory: () => void;
}

const TYPE_META: Record<string, { emoji: string; label: string; bg: string; color: string }> = {
  medicine: { emoji: '💊', label: 'Medicina', bg: '#EAF2F8', color: '#2B5F7A' },
  food:     { emoji: '🍽', label: 'Cibo',     bg: '#EAF5EE', color: '#2E5E3A' },
  other:    { emoji: '🔔', label: 'Altro',    bg: '#F5EAE2', color: '#7A3D22' },
};

const REPEAT_LABEL: Record<string, string> = {
  none:   'Una volta',
  daily:  'Ogni giorno',
  weekly: 'Ogni settimana',
  custom: 'Personalizzato',
};

function formatTimeOfDay(t?: string) {
  if (!t) return '';
  return t.slice(0, 5);
}

export function ReminderListScreen({
  familyId,
  familyName,
  petId,
  petName,
  onBack,
  onCreateReminder,
  onEditReminder,
  onOpenAckHistory,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { reminders, isLoading, error, load, update, remove } = useReminders(familyId, petId);
  const { showAlert } = useAlert();

  useEffect(() => { load(); }, [familyId]);

  async function handleToggle(reminder: Reminder, value: boolean) {
    try {
      await update(reminder.id, {
        title: reminder.title,
        notes: reminder.notes,
        repeat: reminder.repeat,
        cron_expr: reminder.cron_expr,
        scheduled_at: reminder.scheduled_at,
        time_of_day: reminder.time_of_day,
        day_of_week: reminder.day_of_week,
        enabled: value,
      });
    } catch (e) {
      showAlert(e instanceof Error ? e.message : t('retry','Riprova'), { type: 'error' });
    }
  }

  function confirmDelete(reminder: Reminder) {
    Alert.alert(
      t('confirm_delete_title','Eliminare "%s"?',).replace('%s', reminder.title),
      t('confirm_delete_msg','Azione irreversibile.'),
      [
        { text: t('cancel','Annulla'), style: 'cancel' },
        { text: t('delete','Elimina'), style: 'destructive', onPress: () => remove(reminder.id) },
      ]
    );
  }

  if (isLoading && reminders.length === 0) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* NAV */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={onBack} style={styles.navBtn}>
          <Text style={styles.navBack}>{'‹'}</Text>
          <Text style={styles.navLabel}>{t('back', 'Indietro')}</Text>
        </TouchableOpacity>
        <View style={styles.navActions}>
          <TouchableOpacity onPress={onOpenAckHistory} style={styles.historyBtn}>
            <Text style={styles.historyBtnText}>{`📋 ${t('history','Storico')}`}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCreateReminder} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{`＋ ${t('new','Nuovo')}`}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.overline}>{t('reminders','Promemoria')}</Text>
        <Text style={styles.title}>
          {petName ? petName : familyName}
        </Text>
        {petName ? (
          <Text style={styles.subtitle}>{`Famiglia: ${familyName}`}</Text>
        ) : (
          <Text style={styles.subtitle}>{t('all_reminders','Tutti i promemoria')}</Text>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing.xxl },
          reminders.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={load}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ErrorBanner message={error} />

        {reminders.length === 0 && !isLoading ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>{'🔔'}</Text>
            </View>
            <Text style={styles.emptyTitle}>{t('no_reminders','Nessun promemoria')}</Text>
            <Text style={styles.emptyText}>
              {t('no_reminders','Crea il primo promemoria per medicine, pasti o altro!')}
            </Text>
            <Button
              label={t('create_reminder','＋ Crea promemoria')}
              onPress={onCreateReminder}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ) : (
          reminders.map(reminder => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggle={handleToggle}
              onEdit={() => onEditReminder(reminder)}
              onDelete={() => confirmDelete(reminder)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ReminderCard({
  reminder,
  onToggle,
  onEdit,
  onDelete,
}: {
  reminder: Reminder;
  onToggle: (r: Reminder, v: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[reminder.type] ?? TYPE_META.other;
  const repeatLabel = REPEAT_LABEL[reminder.repeat] ?? reminder.repeat;

  let scheduleText = repeatLabel;
  const { t, formatDate, formatTime, locale } = useLocalization();
  if (reminder.time_of_day) {
    scheduleText += ` · ${formatTimeOfDay(reminder.time_of_day)}`;
  }
  if (reminder.repeat === 'weekly' && reminder.day_of_week != null) {
    try {
      const sample = new Date(2023, 0, 1 + reminder.day_of_week);
      const dayShort = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(sample);
      scheduleText += ` · ${dayShort}`;
    } catch {
      scheduleText += ` · ${reminder.day_of_week}`;
    }
  }
  if (reminder.repeat === 'none' && reminder.scheduled_at) {
    scheduleText = formatDate(reminder.scheduled_at, { day: 'numeric', month: 'short' });
    try {
      const d = new Date(reminder.scheduled_at);
      scheduleText += ` · ${formatTime(d, { hour: '2-digit', minute: '2-digit' })}`;
    } catch {}
  }

  return (
    <View style={[styles.card, !reminder.enabled && styles.cardDisabled]}>
      <View style={[styles.accentBar, { backgroundColor: meta.color }]} />

      <View style={styles.cardBody}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
            <Text style={styles.typeEmoji}>{meta.emoji}</Text>
            <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Switch
            value={reminder.enabled}
            onValueChange={v => onToggle(reminder, v)}
            trackColor={{ false: colors.border, true: colors.primaryMid }}
            thumbColor={reminder.enabled ? colors.primary : colors.textMuted}
          />
        </View>

        {/* Title */}
        <Text style={[styles.cardTitle, !reminder.enabled && styles.cardTitleDisabled]}>
          {reminder.title}
        </Text>

        {/* Notes */}
        {!!reminder.notes && (
          <Text style={styles.cardNotes} numberOfLines={2}>{reminder.notes}</Text>
        )}

        {/* Schedule */}
        <View style={styles.metaRow}>
          <Text style={styles.metaIcon}>{'🕐'}</Text>
          <Text style={styles.metaText}>{scheduleText}</Text>
        </View>

        {/* Pet */}
        {reminder.pet && (
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>{'🐾'}</Text>
            <Text style={styles.metaText}>
              {`${reminder.pet.name} · ${reminder.pet.species}`}
            </Text>
          </View>
        )}

        {/* Last acked by */}
        {reminder._lastAckedBy && (
          <View style={styles.ackedRow}>
            <Avatar name={reminder._lastAckedBy} size={18} />
            <Text style={styles.ackedText}>
              {'Fatto da '}
              <Text style={styles.ackedBold}>{reminder._lastAckedBy}</Text>
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
            <Text style={styles.editBtnText}>{'✏ Modifica'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
            <Text style={styles.deleteBtnText}>{'🗑'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  navBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navBack:    { fontSize: 22, color: colors.primary },
  navLabel:   { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  navActions: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },

  historyBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  historyBtnText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },

  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    ...shadow.brand,
  },
  addBtnText: { color: colors.textOnPrimary, fontWeight: '700' },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  overline: { ...typography.overline },
  title:    { ...typography.h1 },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },

  list:      { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  listEmpty: { flexGrow: 1 },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardDisabled: { opacity: 0.55 },
  accentBar:    { width: 4 },
  cardBody:     { flex: 1, padding: spacing.md, gap: spacing.xs },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  typeEmoji: { fontSize: 13 },
  typeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  cardTitle:         { ...typography.h4 },
  cardTitleDisabled: { color: colors.textMuted },
  cardNotes:         { ...typography.bodySmall, color: colors.textSecondary },

  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaIcon:   { fontSize: 12 },
  metaText:   { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },

  ackedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  ackedText: { ...typography.caption, color: colors.success },
  ackedBold: { ...typography.caption, color: colors.success, fontWeight: '700' },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
  },
  editBtnText:   { ...typography.caption, color: colors.primaryDeep, fontWeight: '700' },
  deleteBtn:     { padding: 4 },
  deleteBtnText: { fontSize: 16 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconBox: {
    width: 100, height: 100,
    borderRadius: radius.xxl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primaryMid,
  },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: { ...typography.h2, textAlign: 'center' },
  emptyText:  { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
