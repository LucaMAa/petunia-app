import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';
import request from '../../api/client';
import { useLocalization } from '../../context/LocalizationContext';

interface AckRecord {
  id: string;
  reminder_id: string;
  occurrence_key: string;
  acked_at: string;
  user?: { id: string; first_name: string; last_name: string; avatar_file_id?: string };
  reminder?: {
    id: string;
    title: string;
    type: string;
    notes: string;
    family_id: string;
    pet?: { name: string; species: string } | null;
  };
}

const TYPE_META: Record<string, { emoji: string; label: string; bg: string; color: string }> = {
  medicine: { emoji: '💊', label: 'Medicina', bg: '#EAF2F8', color: '#2B5F7A' },
  food: { emoji: '🍽', label: 'Cibo', bg: '#EAF5EE', color: '#2E5E3A' },
  other: { emoji: '🔔', label: 'Altro', bg: '#F5EAE2', color: '#7A3D22' },
};

async function fetchAckHistory(familyId: string): Promise<AckRecord[]> {
  return request<AckRecord[]>(`/families/${familyId}/reminders/acks`);
}
interface Props {
  familyId: string;
  familyName: string;
  onBack: () => void;
}

export function AckHistoryScreen({ familyId, familyName, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [acks, setAcks] = useState<AckRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAckHistory(familyId);
      setAcks(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento storico');
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    load();
  }, [load]);

  const { t, formatDate, formatTime } = useLocalization();

  const groups = (() => {
    const map = new Map<string, AckRecord[]>();
    for (const a of acks) {
      const label = formatDate(a.acked_at, { day: 'numeric', month: 'long', year: 'numeric' });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(a);
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  })();

  const totalAcks = acks.length;

  const byUser = acks.reduce<Record<string, { name: string; count: number }>>((acc, a) => {
    if (!a.user) return acc;
    const name = `${a.user.first_name} ${a.user.last_name}`;
    const id = a.user.id;
    if (!acc[id]) acc[id] = { name, count: 0 };
    acc[id].count++;
    return acc;
  }, {});

  const topUser = Object.values(byUser).sort((a, b) => b.count - a.count)[0];

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={onBack} style={styles.navBtn}>
          <Text style={styles.navBack}>{'‹'}</Text>
          <Text style={styles.navLabel}>{t('back', 'Indietro')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.overline}>{t('history', 'Storico')}</Text>
        <Text style={styles.title}>{t('completed_alerts', 'Alert completati')}</Text>
        <Text style={styles.subtitle}>{familyName}</Text>
      </View>

      {isLoading && acks.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xxl },
            acks.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          <ErrorBanner message={error} />
          {acks.length > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{totalAcks}</Text>
                <Text style={styles.statLabel}>{t('total_completed', 'completati totali')}</Text>
              </View>
              {topUser && (
                <View style={styles.statCard}>
                  <Text style={styles.statNum}>{topUser.count}</Text>
                  <Text style={styles.statLabel} numberOfLines={1}>
                    {t('done_by', 'Fatto da')} {topUser.name.split(' ')[0]}
                  </Text>
                </View>
              )}
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{groups.length}</Text>
                <Text style={styles.statLabel}>{t('days_active', 'giorni attivi')}</Text>
              </View>
            </View>
          )}

          {acks.length === 0 && !isLoading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyIcon}>{'✅'}</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {t('no_completed_alerts', 'Nessun alert completato')}
              </Text>
              <Text style={styles.emptyText}>
                {t(
                  'no_completed_alerts',
                  'Quando un membro segna un promemoria come fatto, apparirà qui.',
                )}
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.label}>
                <View style={styles.daySep}>
                  <View style={styles.daySepLine} />
                  <Text style={styles.daySepLabel}>{group.label}</Text>
                  <View style={styles.daySepLine} />
                </View>

                {group.items.map((ack) => (
                  <AckCard key={ack.id} ack={ack} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function AckCard({ ack }: { ack: AckRecord }) {
  const rem = ack.reminder;
  const type = rem?.type ?? 'other';
  const meta = TYPE_META[type] ?? TYPE_META.other;
  const { formatTime, formatDate } = useLocalization();
  const time = formatTime(ack.acked_at, { hour: '2-digit', minute: '2-digit' });
  const userName = ack.user ? `${ack.user.first_name} ${ack.user.last_name}` : 'Utente sconosciuto';
  let occLabel = ack.occurrence_key;
  try {
    const d = new Date(ack.occurrence_key + ':00Z');
    occLabel = `${formatDate(d, { day: 'numeric', month: 'short' })} ${formatTime(d, { hour: '2-digit', minute: '2-digit' })}`;
  } catch {}

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
            <Text style={styles.typeEmoji}>{meta.emoji}</Text>
            <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.timeText}>{time}</Text>
        </View>
        <Text style={styles.cardTitle}>{rem?.title ?? '—'}</Text>
        {!!rem?.notes && (
          <Text style={styles.cardNotes} numberOfLines={2}>
            {rem.notes}
          </Text>
        )}

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Avatar name={userName} uri={ack.user?.avatar_file_id} size={20} />
            <View>
              <Text style={styles.metaCaption}>{'Fatto da'}</Text>
              <Text style={styles.metaValue}>{userName}</Text>
            </View>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>{'🕐'}</Text>
            <View>
              <Text style={styles.metaCaption}>{'Schedulato'}</Text>
              <Text style={styles.metaValue}>{occLabel}</Text>
            </View>
          </View>
          {rem?.pet && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>{'🐾'}</Text>
              <View>
                <Text style={styles.metaCaption}>{'Animale'}</Text>
                <Text style={styles.metaValue}>{rem.pet.name}</Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.doneBadge}>
          <Text style={styles.doneBadgeText}>{'✓ Completato'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  nav: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  navBack: { fontSize: 22, color: colors.primary },
  navLabel: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  overline: { ...typography.overline },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  listEmpty: { flexGrow: 1 },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statNum: { ...typography.h2, color: colors.primary },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  daySep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  daySepLine: { flex: 1, height: 1, backgroundColor: colors.border },
  daySepLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xs,
    ...shadow.sm,
  },
  cardAccent: { width: 4 },
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
  timeText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },

  cardTitle: { ...typography.h4 },
  cardNotes: { ...typography.bodySmall, color: colors.textSecondary },
  metaGrid: {
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaIcon: { fontSize: 16 },
  metaCaption: { ...typography.caption, color: colors.textMuted },
  metaValue: { ...typography.bodySmall, fontWeight: '600' },
  doneBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.xs,
  },
  doneBadgeText: { ...typography.caption, color: colors.success, fontWeight: '700' },
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
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryMid,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...typography.h2, textAlign: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
