import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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
import { MapScreen } from '../screens/map/MapScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { OverviewScreen } from '../screens/overview/OverviewScreen';
import { PendingAlertsScreen } from '../screens/reminder/PendingAlertsScreen';
import { AppDestination, AppShell } from '../components/ui/AppShell';
import { InviteBanner } from '../components/ui/InviteBanner';
import { ReminderFiredBanner, ReminderAckedBanner } from '../components/ui/ReminderBanner';
import { FamilyInvite } from '../types';
import { ReminderAckedPayload, ReminderFiredPayload } from '../types/reminders';
import { colors } from '../styles/theme';
import { ActivitiesScreen } from '../screens/activity/ActivitiesScreen';
import { ActivityTrackingProvider } from '../context/ActivityTrackingContext';
import { ActiveActivityBanner } from '../components/ui/ActiveActivityBanner';

function AppNavigator() {
  const { user } = useAuth();
  const [active, setActive] = useState<AppDestination>('overview');
  const [petRefreshKey, setPetRefreshKey] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [fired, setFired] = useState<ReminderFiredPayload | null>(null);
  const [acked, setAcked] = useState<ReminderAckedPayload | null>(null);
  const { invites, load: loadInvites, addInvite, removeInvite } = useInvites();
  const { pending, count, addFromWs, markAcked, reload, isLoading } = usePendingAlerts();
  useEffect(() => {
    loadInvites();
  }, [loadInvites]);
  const { wsRef } = useWebSocket((message) => {
    if (message.event === 'family_invite') {
      const payload = message.payload as FamilyInvite & {
        invite_id: number;
        family_name: string;
        inviter_name: string;
      };
      addInvite({
        id: payload.invite_id,
        family_id: payload.family_id,
        inviter_id: payload.inviter_id,
        invitee_id: '',
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: '',
        family: {
          id: payload.family_id,
          name: payload.family_name,
          created_at: '',
          updated_at: '',
        },
        inviter: {
          id: payload.inviter_id,
          first_name: payload.inviter_name,
          last_name: '',
          email: '',
          status: 'enabled',
          created_at: '',
          updated_at: '',
        },
      });
    }
    if (message.event === 'reminder_fired') {
      const payload = message.payload as ReminderFiredPayload;
      setFired(payload);
      addFromWs(payload);
    }
    if (message.event === 'reminder_acked') {
      const payload = message.payload as ReminderAckedPayload;
      setFired((current) => (current?.reminder_id === payload.reminder_id ? null : current));
      setAcked(payload);
    }
  });
  const respond = async (invite: FamilyInvite, accepted: boolean) => {
    await familiesApi.respondToInvite(invite.id, accepted);
    removeInvite(invite.id);
    if (accepted) setPetRefreshKey((value) => value + 1);
  };
  const page =
    active === 'overview' ? (
      <OverviewScreen
        attentionCount={count}
        onOpenPets={() => setActive('pets')}
        onOpenAlerts={() => setShowAlerts(true)}
        onOpenFamily={() => setActive('families')}
      />
    ) : active === 'pets' ? (
      <PetsNavigator refreshKey={petRefreshKey} />
    ) : active === 'map' ? (
      <MapScreen wsRef={wsRef} />
    ) : active === 'activities' ? (
      <ActivitiesScreen />
    ) : active === 'families' ? (
      <FamiliesNavigator liveInvites={invites} onInviteResponded={removeInvite} />
    ) : (
      <ProfileScreen />
    );
  return (
    <View style={styles.app}>
      <AppShell
        active={active}
        onNavigate={setActive}
        notificationCount={count}
        onNotifications={() => setShowAlerts(true)}
        onFamily={() => setActive('families')}
        userName={[user?.first_name, user?.last_name].filter(Boolean).join(' ')}
        userAvatar={user?.avatar?.url}
      >
        {page}
      </AppShell>
      <ActiveActivityBanner visible={active !== 'map'} onOpen={() => setActive('map')} />
      {showAlerts ? (
        <View style={StyleSheet.absoluteFillObject}>
          <PendingAlertsScreen
            alerts={pending}
            isLoading={isLoading}
            onBack={() => setShowAlerts(false)}
            onAck={markAcked}
            onReload={reload}
          />
        </View>
      ) : null}
      {fired ? (
        <ReminderFiredBanner
          payload={fired}
          onAck={async (key) => {
            try {
              await remindersApi.ack(fired.reminder_id, key);
              markAcked(fired.reminder_id, key);
            } catch {}
          }}
          onDismiss={() => setFired(null)}
        />
      ) : null}
      {acked ? <ReminderAckedBanner payload={acked} onDismiss={() => setAcked(null)} /> : null}
      {invites.length > 0 && !showAlerts ? (
        <View style={styles.invites}>
          <InviteBanner
            invite={invites[0]}
            onAccept={() => respond(invites[0], true)}
            onDecline={() => respond(invites[0], false)}
          />
        </View>
      ) : null}
    </View>
  );
}
function RootContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  return isLoading ? (
    <View style={[styles.splash, { paddingTop: insets.top }]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  ) : isAuthenticated ? (
    <AppNavigator />
  ) : (
    <AuthNavigator />
  );
}
export function RootNavigator() {
  return (
    <SafeAreaProvider>
      <ActivityTrackingProvider>
        <RootContent />
      </ActivityTrackingProvider>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  invites: { position: 'absolute', right: 16, left: 16, bottom: 92 },
});
