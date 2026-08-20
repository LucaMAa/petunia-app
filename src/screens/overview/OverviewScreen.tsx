import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { usePets } from '../../hooks/usePets';
import { colors, radius, spacing, typography } from '../../styles/theme';
import { Pet } from '../../types';
import { useLocalization } from '../../context/LocalizationContext';
import { Header, PetRow, Timeline } from './components';
export function OverviewScreen({
  attentionCount,
  onOpenPets,
  onOpenAlerts,
  onOpenFamily,
}: {
  attentionCount: number;
  onOpenPets: () => void;
  onOpenAlerts: () => void;
  onOpenFamily: () => void;
}) {
  const { user } = useAuth();
  const { pets, isLoading, load } = usePets();
  useEffect(() => {
    load();
  }, [load]);
  const hour = new Date().getHours();
  const { t } = useLocalization();
  const greeting =
    hour < 12 ? t('greeting_morning') : hour < 18 ? t('greeting_afternoon') : t('greeting_evening');

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.greeting}>
          {greeting}
          {user?.first_name ? `, ${user.first_name}` : ''}.
        </Text>
        <Text style={styles.heroCopy}>{t('overview_copy')}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onOpenAlerts} style={styles.focus}>
        <View style={styles.focusCopy}>
          <Text style={styles.eyebrow}>{t('alerts_and_reminders')}</Text>
          <Text style={styles.focusTitle}>
            {attentionCount
              ? `${attentionCount} ${t('attention_activities')}`
              : t('all_under_control')}
          </Text>
          <Text style={styles.focusText}>
            {attentionCount ? t('open_alerts_to_manage') : t('no_pending_alerts')}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{attentionCount}</Text>
          <Text style={styles.metricLabel}>{t('alerts')}</Text>
        </View>
      </Pressable>
      <Header title={t('pets_title')} action={t('manage')} onAction={onOpenPets} />
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : pets.length ? (
        <View style={styles.rows}>
          {pets.slice(0, 4).map((pet) => (
            <PetRow key={pet.id} pet={pet} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="paw-outline" size={22} color={colors.primary} />
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>{t('no_pets_title')}</Text>
            <Text style={styles.emptyText}>{t('no_pets_copy')}</Text>
          </View>
          <Button label={t('add_pet')} onPress={onOpenPets} fullWidth={false} size="sm" />
        </View>
      )}
      <Header title={t('family_space')} action={t('open')} onAction={onOpenFamily} />
      <Pressable onPress={onOpenFamily} style={styles.familyRow}>
        <View style={styles.iconBox}>
          <Ionicons name="people-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>{t('my_family')}</Text>
          <Text style={styles.rowMeta}>{t('family_members')}</Text>
        </View>
        <Ionicons name="chevron-forward" color={colors.textMuted} size={18} />
      </Pressable>
      <Header title={t('featured')} />
      <View style={styles.rows}>
        <Timeline
          icon="calendar-outline"
          title={t('upcoming_appointments')}
          text={t('appointment_copy')}
        />
        <Timeline
          icon="document-text-outline"
          title={t('health_documents')}
          text={t('health_documents_copy')}
        />
        <Timeline
          icon="time-outline"
          title={t('recent_activities')}
          text={t('recent_activities_copy')}
          last
        />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
    maxWidth: 980,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { marginBottom: spacing.xxl },
  greeting: { ...typography.display },
  heroCopy: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  focus: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  focusCopy: { flex: 1, paddingRight: spacing.lg },
  eyebrow: { ...typography.overline, marginBottom: spacing.xs },
  focusTitle: { ...typography.h2 },
  focusText: { ...typography.bodySmall, marginTop: spacing.sm },
  metric: {
    minWidth: 72,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.lg,
  },
  metricValue: { fontSize: 32, fontWeight: '700', color: colors.primary },
  metricLabel: { ...typography.caption },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3 },
  action: { ...typography.label, color: colors.primary },
  loader: { paddingVertical: spacing.xxl },
  rows: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.xxxl,
  },
  row: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  familyRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xxxl,
  },
  rowCopy: { flex: 1 },
  rowTitle: { ...typography.bodyMedium },
  rowMeta: {
    ...typography.caption,
    marginTop: spacing.xxs,
    textTransform: 'capitalize',
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  statusText: { ...typography.caption, color: colors.success },
  empty: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  emptyCopy: { flex: 1 },
  emptyTitle: { ...typography.bodyMedium },
  emptyText: { ...typography.bodySmall, marginTop: spacing.xxs },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
