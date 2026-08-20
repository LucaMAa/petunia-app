import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PendingAlert } from '../../hooks/usePendingAlerts';
import { remindersApi } from '../../api/reminders';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { useLocalization } from '../../context/LocalizationContext';

const TYPE_META: Record<string, { emoji: string; label: string; bg: string; color: string }> = {
  medicine: { emoji: '💊', label: 'Medicina', bg: '#EAF2F8', color: '#2B5F7A' },
  food: { emoji: '🍽', label: 'Cibo', bg: '#EAF5EE', color: '#2E5E3A' },
  other: { emoji: '🔔', label: 'Altro', bg: '#F5EAE2', color: '#7A3D22' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'adesso';
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}

interface Props {
  alerts: PendingAlert[];
  isLoading: boolean;
  onBack: () => void;
  onAck: (reminderId: string, occurrenceKey: string) => void;
  onReload: () => Promise<void>;
}

export function PendingAlertsScreen({ alerts, isLoading, onBack, onAck, onReload }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const [ackingId, setAckingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAck(alert: PendingAlert) {
    const key = `${alert.reminder_id}_${alert.occurrence_key}`;
    setAckingId(key);
    setError(null);
    try {
      await remindersApi.ack(alert.reminder_id, alert.occurrence_key);
      onAck(alert.reminder_id, alert.occurrence_key);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_ack', 'Errore durante la conferma'));
    } finally {
      setAckingId(null);
    }
  }

  function confirmAckAll() {
    Alert.alert(
      t('confirm_ack_all_title', 'Segna tutti come fatti?'),
      t('confirm_ack_all_msg', `Confermi ${alerts.length} alert in sospeso?`),
      [
        { text: t('cancel', 'Annulla'), style: 'cancel' },
        {
          text: t('confirm_all', 'Conferma tutti'),
          onPress: async () => {
            for (const a of alerts) {
              try {
                await remindersApi.ack(a.reminder_id, a.occurrence_key);
                onAck(a.reminder_id, a.occurrence_key);
              } catch {}
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={onBack} style={styles.navBtn}>
          <Text style={styles.navBack}>‹</Text>
          <Text style={styles.navLabel}>{t('back')}</Text>
        </TouchableOpacity>
        {alerts.length > 1 && (
          <TouchableOpacity onPress={confirmAckAll} style={styles.ackAllBtn}>
            <Text style={styles.ackAllText}>{t('ack_all')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.header}>
        <Text style={styles.overline}>{t('not_completed')}</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('pending_alerts_title')}</Text>
          {alerts.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{alerts.length}</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>{t('pending_alerts_subtitle')}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing.xxl },
          alerts.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onReload}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ErrorBanner message={error} />

        {alerts.length === 0 && !isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('all_good')}</Text>
            <Text style={styles.emptyText}>{t('no_pending_24h')}</Text>
          </View>
        ) : (
          alerts.map((alert) => {
            const rem = alert.reminder;
            const meta = TYPE_META[rem?.type ?? 'other'] ?? TYPE_META.other;
            const key = `${alert.reminder_id}_${alert.occurrence_key}`;
            const isAcking = ackingId === key;

            return (
              <View key={alert.id} style={styles.card}>
                <View style={[styles.accentBar, { backgroundColor: colors.error }]} />

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                      <Text style={styles.typeEmoji}>{meta.emoji}</Text>
                      <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <View style={styles.missedTag}>
                      <Text style={styles.missedTagText}>{t('not_done_tag', '⚠ Non fatto')}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{rem?.title ?? '—'}</Text>
                  {!!rem?.notes && (
                    <Text style={styles.cardNotes} numberOfLines={2}>
                      {rem.notes}
                    </Text>
                  )}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaIcon}>🕐</Text>
                    <Text style={styles.metaText}>Scattato {timeAgo(alert.fired_at)}</Text>
                  </View>
                  {rem?.pet && (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaIcon}>🐾</Text>
                      <Text style={styles.metaText}>{rem.pet.name}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.ackBtn, isAcking && { opacity: 0.6 }]}
                    onPress={() => handleAck(alert)}
                    disabled={isAcking}
                  >
                    {isAcking ? (
                      <ActivityIndicator size="small" color={colors.textOnPrimary} />
                    ) : (
                      <Text style={styles.ackBtnText}>✓ Segna come fatto</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navBack: { fontSize: 22, color: colors.primary },
  navLabel: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  ackAllBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.success,
    borderRadius: radius.pill,
  },
  ackAllText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  overline: { ...typography.overline, color: colors.error },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.h1 },
  countBadge: {
    backgroundColor: colors.error,
    minWidth: 26,
    height: 26,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  listEmpty: { flexGrow: 1 },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F0CECE',
    overflow: 'hidden',
    ...shadow.sm,
  },
  accentBar: { width: 4 },
  cardBody: { flex: 1, padding: spacing.md, gap: spacing.xs },

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

  missedTag: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#F0CECE',
  },
  missedTagText: { fontSize: 10, fontWeight: '800', color: colors.error },

  cardTitle: { ...typography.h4 },
  cardNotes: { ...typography.bodySmall, color: colors.textSecondary },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  metaIcon: { fontSize: 12 },
  metaText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },

  ackBtn: {
    marginTop: spacing.sm,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: radius.xxl,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.success + '40',
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...typography.h2, textAlign: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
