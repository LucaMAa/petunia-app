import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { familiesApi } from '../api/families';
import { remindersApi } from '../api/reminders';
import { useInvites } from '../hooks/useInvites';
import { useWebSocket } from '../hooks/useWebSocket';
import { usePendingAlerts } from '../hooks/usePendingAlerts';

import { AuthNavigator } from './AuthNavigator';
import { PetsNavigator } from './PetsNavigator';
import { FamiliesNavigator } from './FamiliesNavigator';
import { TabBar, TabItem } from './TabBar';

import { MapScreen } from '../screens/map/MapScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { PendingAlertsScreen } from '../screens/reminder/PendingAlertsScreen';

import { InviteBanner } from '../components/ui/InviteBanner';
import { ReminderFiredBanner, ReminderAckedBanner } from '../components/ui/ReminderBanner';

import { FamilyInvite } from '../types';
import { ReminderAckedPayload, ReminderFiredPayload } from '../types/reminders';
import { colors, spacing, typography, shadow, radius } from '../styles/theme';

type Tab = 'pets' | 'map' | 'families' | 'profile';

function AppNavigator() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('pets');
  const [petRefreshKey, setPetRefreshKey] = useState(0);
  const [showPendingAlerts, setShowPendingAlerts] = useState(false);
  const { invites, load: loadInvites, addInvite, removeInvite } = useInvites();

  useEffect(() => { loadInvites(); }, []);

  const [firedReminder, setFiredReminder] = useState<ReminderFiredPayload | null>(null);
  const [ackedReminder, setAckedReminder] = useState<ReminderAckedPayload | null>(null);

  const {
    pending: pendingAlerts,
    count: pendingCount,
    addFromWs: addPendingFromWs,
    markAcked: markAlertAcked,
    reload: reloadAlerts,
    isLoading: alertsLoading,
  } = usePendingAlerts();

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
      setFiredReminder((prev) =>
        prev?.reminder_id === p.reminder_id ? null : prev
      );
      setAckedReminder(p);
    }
  });

  async function handleAccept(invite: FamilyInvite) {
    await familiesApi.respondToInvite(invite.id, true);
    removeInvite(invite.id);
    setPetRefreshKey((k) => k + 1);
  }

  async function handleDecline(invite: FamilyInvite) {
    await familiesApi.respondToInvite(invite.id, false);
    removeInvite(invite.id);
  }

  return (
    <View style={styles.appContainer}>

      <View style={styles.content}>
        <View style={[StyleSheet.absoluteFillObject, { display: activeTab === 'pets' ? 'flex' : 'none' }]}>
          <PetsNavigator refreshKey={petRefreshKey} />
        </View>
        <View style={[StyleSheet.absoluteFillObject, { display: activeTab === 'map' ? 'flex' : 'none' }]}>
          <MapScreen wsRef={wsRef} />
        </View>
        <View style={[StyleSheet.absoluteFillObject, { display: activeTab === 'families' ? 'flex' : 'none' }]}>
          <FamiliesNavigator liveInvites={invites} onInviteResponded={removeInvite} />
        </View>
        <View style={[StyleSheet.absoluteFillObject, { display: activeTab === 'profile' ? 'flex' : 'none' }]}>
          <ProfileScreen />
        </View>
      </View>

      {showPendingAlerts && (
        <View style={StyleSheet.absoluteFillObject}>
          <PendingAlertsScreen
            alerts={pendingAlerts}
            isLoading={alertsLoading}
            onBack={() => setShowPendingAlerts(false)}
            onAck={(rid, occ) => markAlertAcked(rid, occ)}
            onReload={reloadAlerts}
          />
        </View>
      )}

      {firedReminder && (
        <ReminderFiredBanner
          payload={firedReminder}
          onAck={async (occurrenceKey) => {
            try {
              await remindersApi.ack(firedReminder.reminder_id, occurrenceKey);
              markAlertAcked(firedReminder.reminder_id, occurrenceKey);
            } catch { }
          }}
          onDismiss={() => setFiredReminder(null)}
        />
      )}

      {ackedReminder && (
        <ReminderAckedBanner
          payload={ackedReminder}
          onDismiss={() => setAckedReminder(null)}
        />
      )}

      {invites.length > 0 && !showPendingAlerts && (
        <View style={styles.inviteBannerContainer}>
          <InviteBanner
            invite={invites[0]}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        </View>
      )}

      {pendingCount > 0 && !showPendingAlerts && (
        <TouchableOpacity
          style={[styles.bellFab, { bottom: insets.bottom + 80 }]}
          onPress={() => setShowPendingAlerts(true)}
        >
          <Text style={styles.bellFabIcon}>🔔</Text>
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Tab bar ── */}
      <TabBar paddingBottom={Math.max(insets.bottom, 8)}>
        <TabItem
          icon="🐾"
          label="Animali"
          active={activeTab === 'pets'}
          onPress={() => setActiveTab('pets')}
        />
        <TabItem
          icon="🗺️"
          label="Mappa"
          active={activeTab === 'map'}
          onPress={() => setActiveTab('map')}
        />
        <TabItem
          icon="🏠"
          label="Famiglia"
          active={activeTab === 'families'}
          onPress={() => setActiveTab('families')}
          badge={invites.length}
        />
        <TabItem
          icon="👤"
          label="Profilo"
          active={activeTab === 'profile'}
          onPress={() => setActiveTab('profile')}
        />
      </TabBar>
    </View>
  );
}

function RootContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={[styles.splash, { paddingTop: insets.top }]}>
        <Text style={styles.splashIcon}>🐾</Text>
        <Text style={styles.splashTitle}>Petunia</Text>
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

export function RootNavigator() {
  return (
    <SafeAreaProvider>
      <RootContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  splashIcon:  { fontSize: 72 },
  splashTitle: { ...typography.h1, color: colors.primaryDeep },

  appContainer: { flex: 1, backgroundColor: colors.background },
  content:      { flex: 1 },

  inviteBannerContainer: {
    position: 'absolute',
    bottom: 100,
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
  },

  bellFab: {
    position: 'absolute',
    right: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 99,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
    ...shadow.lg,
  },
  bellFabIcon: { fontSize: 24 },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 99,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  bellBadgeText: { fontSize: 10, fontWeight: '800', color: colors.error },
});
