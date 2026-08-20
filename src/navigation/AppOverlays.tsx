import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InviteBanner } from '../components/ui/InviteBanner';
import { ReminderFiredBanner, ReminderAckedBanner } from '../components/ui/ReminderBanner';
import { PendingAlertsScreen } from '../screens/reminder/PendingAlertsScreen';

import { AppOverlaysState } from '../hooks/useAppOverlays';
import { colors, spacing, shadow, layout } from '../styles/theme';

type Props = Pick<
  AppOverlaysState,
  | 'invites'
  | 'handleAccept'
  | 'handleDecline'
  | 'firedReminder'
  | 'ackedReminder'
  | 'dismissFired'
  | 'dismissAcked'
  | 'ackFiredReminder'
  | 'pendingAlerts'
  | 'pendingCount'
  | 'alertsLoading'
  | 'showPendingAlerts'
  | 'openPendingAlerts'
  | 'closePendingAlerts'
  | 'markAlertAcked'
  | 'reloadAlerts'
>;

export function AppOverlays({
  invites,
  handleAccept,
  handleDecline,
  firedReminder,
  ackedReminder,
  dismissFired,
  dismissAcked,
  ackFiredReminder,
  pendingAlerts,
  pendingCount,
  alertsLoading,
  showPendingAlerts,
  openPendingAlerts,
  closePendingAlerts,
  markAlertAcked,
  reloadAlerts,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <>
      {showPendingAlerts && (
        <View style={StyleSheet.absoluteFillObject}>
          <PendingAlertsScreen
            alerts={pendingAlerts}
            isLoading={alertsLoading}
            onBack={closePendingAlerts}
            onAck={(rid, occ) => markAlertAcked(rid, occ)}
            onReload={reloadAlerts}
          />
        </View>
      )}

      {firedReminder && (
        <ReminderFiredBanner
          payload={firedReminder}
          onAck={ackFiredReminder}
          onDismiss={dismissFired}
        />
      )}

      {ackedReminder && <ReminderAckedBanner payload={ackedReminder} onDismiss={dismissAcked} />}

      {invites.length > 0 && !showPendingAlerts && (
        <View
          style={[
            styles.inviteBannerContainer,
            { bottom: insets.bottom + layout.tabBarHeight + spacing.md },
          ]}
        >
          <InviteBanner invite={invites[0]} onAccept={handleAccept} onDecline={handleDecline} />
        </View>
      )}

      {pendingCount > 0 && !showPendingAlerts && (
        <TouchableOpacity
          style={[styles.bellFab, { bottom: insets.bottom + layout.tabBarHeight + spacing.lg }]}
          onPress={openPendingAlerts}
        >
          <Text style={styles.bellFabIcon}>🔔</Text>
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
          </View>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
