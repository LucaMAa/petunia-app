import React, { useState, useEffect, useCallback } from 'react';
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
import { useAlert } from '../../components/ui/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FamilyInvite } from '../../types';
import { familiesApi } from '../../api/families';
import { Avatar } from '../../components/ui/Avatar';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';
import { useLocalization } from '../../context/LocalizationContext';

type Tab = 'received' | 'sent';

interface Props {
  liveInvites: FamilyInvite[];
  onInviteResponded: (inviteId: number) => void;
  onBack: () => void;
}

export function InvitesScreen({ liveInvites, onInviteResponded, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { t, formatDate } = useLocalization();
  const { showAlert } = useAlert();
  const [tab, setTab] = useState<Tab>('received');

  const [received, setReceived] = useState<FamilyInvite[]>([]);
  const [sent, setSent] = useState<FamilyInvite[]>([]);
  const [isLoadingReceived, setIsLoadingReceived] = useState(false);
  const [isLoadingSent, setIsLoadingSent] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    setReceived((prev) => {
      const existing = new Set(prev.map((i) => i.id));
      const newOnes = liveInvites.filter((i) => !existing.has(i.id));
      return [...newOnes, ...prev];
    });
  }, [liveInvites]);

  const loadReceived = useCallback(async () => {
    setIsLoadingReceived(true);
    try {
      const data = await familiesApi.getPendingInvites();
      setReceived(data ?? []);
    } catch {
    } finally {
      setIsLoadingReceived(false);
    }
  }, []);

  const loadSent = useCallback(async () => {
    setIsLoadingSent(true);
    try {
      const data = await familiesApi.getSentInvites();
      setSent(data ?? []);
    } catch {
    } finally {
      setIsLoadingSent(false);
    }
  }, []);

  useEffect(() => {
    loadReceived();
  }, [loadReceived]);
  useEffect(() => {
    if (tab === 'sent') loadSent();
  }, [tab, loadSent]);

  async function handleRespond(invite: FamilyInvite, accepted: boolean) {
    setRespondingId(invite.id);
    try {
      await familiesApi.respondToInvite(invite.id, accepted);
      setReceived((prev) => prev.filter((i) => i.id !== invite.id));
      onInviteResponded(invite.id);
    } catch (e) {
      showAlert(e instanceof Error ? e.message : 'Riprova', { type: 'error' });
    } finally {
      setRespondingId(null);
    }
  }

  function confirmCancel(invite: FamilyInvite) {
    const name = invite.family?.name ?? 'questa famiglia';
    Alert.alert("Annullare l'invito?", `Vuoi ritirare l'invito per ${name}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sì, annulla', style: 'destructive', onPress: () => handleCancel(invite) },
    ]);
  }

  async function handleCancel(invite: FamilyInvite) {
    setCancellingId(invite.id);
    try {
      await familiesApi.cancelInvite(invite.id);
      setSent((prev) => prev.filter((i) => i.id !== invite.id));
    } catch (e) {
      showAlert(e instanceof Error ? e.message : 'Riprova', { type: 'error' });
    } finally {
      setCancellingId(null);
    }
  }

  const isRefreshing = tab === 'received' ? isLoadingReceived : isLoadingSent;

  function onRefresh() {
    if (tab === 'received') loadReceived();
    else loadSent();
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={onBack} style={styles.navBtn}>
          <Text style={styles.navBack}>‹</Text>
          <Text style={styles.navLabel}>{t('back', 'Indietro')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.overline}>Gestisci</Text>
        <Text style={styles.title}>Inviti</Text>
      </View>

      <View style={styles.tabsWrapper}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'received' && styles.tabBtnActive]}
            onPress={() => setTab('received')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, tab === 'received' && styles.tabBtnTextActive]}>
              Ricevuti
            </Text>
            {received.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{received.length > 9 ? '9+' : received.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, tab === 'sent' && styles.tabBtnActive]}
            onPress={() => setTab('sent')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, tab === 'sent' && styles.tabBtnTextActive]}>
              Inviati
            </Text>
            {sent.length > 0 && (
              <View style={[styles.badge, styles.badgeMuted]}>
                <Text style={[styles.badgeText, styles.badgeTextMuted]}>
                  {sent.length > 9 ? '9+' : sent.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xxl }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {tab === 'received' && (
          <>
            {isLoadingReceived && received.length === 0 ? (
              <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : received.length === 0 ? (
              <EmptyState
                title="Nessun invito"
                subtitle="Quando qualcuno ti inviterà in una famiglia, lo vedrai qui"
              />
            ) : (
              received.map((invite) => (
                <ReceivedCard
                  key={invite.id}
                  invite={invite}
                  isResponding={respondingId === invite.id}
                  onAccept={() => handleRespond(invite, true)}
                  onDecline={() => handleRespond(invite, false)}
                />
              ))
            )}
          </>
        )}

        {tab === 'sent' && (
          <>
            {isLoadingSent && sent.length === 0 ? (
              <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : sent.length === 0 ? (
              <EmptyState
                title="Nessun invito inviato"
                subtitle="Gli inviti in attesa di risposta appariranno qui"
              />
            ) : (
              sent.map((invite) => (
                <SentCard
                  key={invite.id}
                  invite={invite}
                  isCancelling={cancellingId === invite.id}
                  onCancel={() => confirmCancel(invite)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ReceivedCard({
  invite,
  isResponding,
  onAccept,
  onDecline,
}: {
  invite: FamilyInvite;
  isResponding: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const inviterName = invite.inviter
    ? `${invite.inviter.first_name} ${invite.inviter.last_name}`
    : 'Utente sconosciuto';
  const familyName = invite.family?.name ?? '…';
  const { formatDate } = useLocalization();
  const expiresAt = invite.expires_at
    ? formatDate(invite.expires_at, { day: 'numeric', month: 'short' })
    : null;

  return (
    <View style={rcStyles.card}>
      <View style={rcStyles.accentBar} />
      <View style={rcStyles.inner}>
        <View style={rcStyles.topRow}>
          <View style={rcStyles.iconBox}>
            <Text style={{ fontSize: 26 }}>🏠</Text>
          </View>
          <View style={rcStyles.info}>
            <Text style={rcStyles.label}>INVITO FAMIGLIA</Text>
            <Text style={rcStyles.familyName}>{familyName}</Text>
            <View style={rcStyles.inviterRow}>
              <Avatar name={inviterName} size={18} />
              <Text style={rcStyles.inviterText}>da {inviterName}</Text>
            </View>
          </View>
          {expiresAt && (
            <View style={rcStyles.expiry}>
              <Text style={rcStyles.expiryLabel}>Scade</Text>
              <Text style={rcStyles.expiryDate}>{expiresAt}</Text>
            </View>
          )}
        </View>
        {isResponding ? (
          <View style={rcStyles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={rcStyles.loadingText}>Elaborazione…</Text>
          </View>
        ) : (
          <View style={rcStyles.actions}>
            <TouchableOpacity style={rcStyles.btnDecline} onPress={onDecline} activeOpacity={0.75}>
              <Text style={rcStyles.btnDeclineText}>Rifiuta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rcStyles.btnAccept} onPress={onAccept} activeOpacity={0.75}>
              <Text style={rcStyles.btnAcceptText}>✓ Accetta</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const rcStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryMid,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  accentBar: { width: 4, backgroundColor: colors.primary },
  inner: { flex: 1, padding: spacing.md, gap: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  label: { ...typography.label, color: colors.primary },
  familyName: { ...typography.h4, color: colors.text },
  inviterRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  inviterText: { ...typography.caption, color: colors.textMuted },
  expiry: { alignItems: 'flex-end', gap: 2 },
  expiryLabel: { ...typography.caption, color: colors.textMuted },
  expiryDate: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btnDecline: {
    flex: 1,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  btnDeclineText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: 14,
  },
  btnAccept: {
    flex: 2,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.brand,
  },
  btnAcceptText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textOnPrimary,
    fontSize: 14,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 38 },
  loadingText: { ...typography.bodySmall, color: colors.textMuted },
});

function SentCard({
  invite,
  isCancelling,
  onCancel,
}: {
  invite: FamilyInvite;
  isCancelling: boolean;
  onCancel: () => void;
}) {
  const familyName = invite.family?.name ?? '…';
  const { formatDate, formatTime } = useLocalization();
  const sentAt = invite.created_at
    ? `${formatDate(invite.created_at, { day: 'numeric', month: 'short' })} · ${formatTime(invite.created_at, { hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <View style={scStyles.card}>
      <View style={scStyles.left}>
        <View style={scStyles.iconBox}>
          <Text style={{ fontSize: 24 }}>🏠</Text>
        </View>
        <View style={scStyles.info}>
          <Text style={scStyles.familyName}>{familyName}</Text>
          {sentAt && <Text style={scStyles.meta}>Inviato {sentAt}</Text>}
          <View style={scStyles.statusRow}>
            <View style={scStyles.pendingDot} />
            <Text style={scStyles.statusText}>In attesa di risposta</Text>
          </View>
        </View>
      </View>
      {isCancelling ? (
        <ActivityIndicator size="small" color={colors.error} />
      ) : (
        <TouchableOpacity
          onPress={onCancel}
          style={scStyles.cancelBtn}
          hitSlop={8}
          activeOpacity={0.75}
        >
          <Text style={scStyles.cancelText}>Annulla</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const scStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.xs,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  familyName: { ...typography.h4 },
  meta: { ...typography.caption, color: colors.textMuted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  pendingDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: colors.accent },
  statusText: { ...typography.caption, color: colors.accent, fontWeight: '600' },
  cancelBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  cancelText: { ...typography.caption, color: colors.error, fontWeight: '700' },
});

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={emStyles.container}>
      <Text style={emStyles.title}>{title}</Text>
      <Text style={emStyles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const emStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: radius.xxl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryMid,
  },
  icon: { fontSize: 48 },
  title: { ...typography.h2, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  tabsWrapper: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.xl,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    gap: 6,
  },
  tabBtnActive: { backgroundColor: colors.surface, ...shadow.xs },
  tabBtnText: { ...typography.body, fontWeight: '600', color: colors.textMuted, fontSize: 14 },
  tabBtnTextActive: { color: colors.primaryDeep },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 99,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeMuted: { backgroundColor: colors.primaryLight },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.textOnPrimary },
  badgeTextMuted: { color: colors.primaryDeep },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  center: { paddingTop: spacing.xxl, alignItems: 'center' },
});
