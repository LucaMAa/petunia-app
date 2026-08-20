import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActivityTrackingContext } from '../../context/ActivityTrackingContext';
import { colors, layout, radius, shadow, spacing } from '../../styles/theme';

const labels = {
  walk: 'Passeggiata',
  run: 'Corsa',
  hike: 'Escursione',
  park: 'Giro al parco',
  free: 'Attività',
};
const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function ActiveActivityBanner({
  visible,
  onOpen,
}: {
  visible: boolean;
  onOpen: () => void;
}) {
  const { activity } = useActivityTrackingContext();
  const insets = useSafeAreaInsets();
  if (!activity || !visible) return null;
  const paused = activity.status === 'paused';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Apri attività in corso"
      onPress={onOpen}
      style={[
        styles.banner,
        { bottom: layout.tabBarHeight + Math.max(insets.bottom, spacing.sm) + spacing.sm },
      ]}
    >
      <View style={[styles.status, paused && styles.statusPaused]} />
      <View style={styles.copy}>
        <Text style={styles.title}>
          {paused ? `${labels[activity.type]} in pausa` : `${labels[activity.type]} in corso`}
        </Text>
        <Text style={styles.meta}>
          {activity.pet?.name ?? 'Attività privata'} · {clock(activity.duration_s)} ·{' '}
          {(activity.distance_m / 1000).toFixed(2)} km
        </Text>
      </View>
      <Ionicons name="arrow-forward" size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    minHeight: 56,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderMid,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.md,
    zIndex: 80,
  },
  status: { width: 9, height: 9, borderRadius: radius.pill, backgroundColor: colors.success },
  statusPaused: { backgroundColor: colors.warning },
  copy: { flex: 1 },
  title: { color: colors.text, fontWeight: '800', fontSize: 13 },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
