import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Activity } from '../../../types';
import { colors, radius, shadow, spacing } from '../../../styles/theme';

const labels = {
  walk: 'Passeggiata',
  run: 'Corsa',
  hike: 'Escursione',
  park: 'Giro al parco',
  free: 'Attività libera',
};
const duration = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function ActivityDock({
  activity,
  dock,
  containerHeight,
  onDockChange,
  onPause,
  onResume,
  onFinish,
}: {
  activity: Activity | null;
  dock: { minimized: boolean; top: number | null };
  containerHeight: number;
  onDockChange: (next: { minimized: boolean; top: number | null }) => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
}) {
  const dockRef = useRef(dock);
  const startTop = useRef(dock.top ?? 104);
  const dockHeight = dock.minimized ? 46 : 218;
  const maxTop = Math.max(76, (containerHeight || 420) - dockHeight - spacing.lg);
  useEffect(() => {
    dockRef.current = dock;
  }, [dock]);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          startTop.current = dockRef.current.top ?? 104;
        },
        onPanResponderMove: (_, gesture) =>
          onDockChange({
            ...dockRef.current,
            top: Math.max(76, Math.min(maxTop, startTop.current + gesture.dy)),
          }),
        onPanResponderRelease: (_, gesture) => {
          const movedTop = Math.max(76, Math.min(maxTop, startTop.current + gesture.dy));
          const snapPoints = [76, Math.round((76 + maxTop) / 2), maxTop];
          const top = snapPoints.reduce((closest, point) =>
            Math.abs(point - movedTop) < Math.abs(closest - movedTop) ? point : closest,
          );
          onDockChange({ ...dockRef.current, top });
        },
      }),
    [maxTop, onDockChange],
  );
  if (!activity) return null;
  const paused = activity.status === 'paused';
  const top = Math.max(76, Math.min(maxTop, dock.top ?? 104));
  if (dock.minimized)
    return (
      <View style={[styles.pill, { top }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Espandi attività in corso"
          onPress={() => onDockChange({ ...dock, minimized: false })}
          style={styles.pillTap}
        >
          <View style={[styles.dot, paused && styles.dotPaused]} />
          <Text style={styles.pillText}>
            {duration(activity.duration_s)} · {(activity.distance_m / 1000).toFixed(2)} km
          </Text>
          <Ionicons name="chevron-up" color={colors.textSecondary} size={16} />
        </TouchableOpacity>
      </View>
    );
  return (
    <View style={[styles.active, { top }]}>
      <View
        {...panResponder.panHandlers}
        style={styles.dragZone}
        accessible
        accessibilityLabel="Trascina controlli attività"
      >
        <View style={styles.grabber} />
      </View>
      <View style={styles.activeTop}>
        <View style={styles.heading}>
          <View style={[styles.dot, paused && styles.dotPaused]} />
          <View>
            <Text style={styles.live}>{paused ? 'IN PAUSA' : 'LIVE ACTIVITY'}</Text>
            <Text style={styles.pet}>{activity.pet?.name ?? labels[activity.type]}</Text>
          </View>
        </View>
        <TouchableOpacity
          accessibilityLabel="Riduci controlli attività"
          onPress={() => onDockChange({ ...dock, minimized: true })}
          style={styles.iconButton}
        >
          <Ionicons name="remove" color={colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>
      <View style={styles.stats}>
        <View>
          <Text style={styles.value}>{duration(activity.duration_s)}</Text>
          <Text style={styles.caption}>DURATA</Text>
        </View>
        <View>
          <Text style={styles.value}>{(activity.distance_m / 1000).toFixed(2)} km</Text>
          <Text style={styles.caption}>DISTANZA</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={paused ? onResume : onPause} style={styles.pause}>
          <Ionicons name={paused ? 'play' : 'pause'} color={colors.textOnPrimary} size={17} />
          <Text style={styles.pauseText}>{paused ? 'Riprendi' : 'Pausa'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Terminare attività?',
              'Il percorso e i dati raccolti saranno salvati nel diario.',
              [
                { text: 'Continua', style: 'cancel' },
                { text: 'Termina', style: 'destructive', onPress: onFinish },
              ],
            )
          }
          style={styles.finish}
        >
          <Text style={styles.finishText}>Termina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  active: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderMid,
    ...shadow.lg,
    zIndex: 30,
  },
  pill: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderMid,
    ...shadow.md,
  },
  pillTap: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pillText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  grabber: {
    alignSelf: 'center',
    width: 34,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  dragZone: { height: 24, justifyContent: 'flex-start' },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: radius.pill, backgroundColor: colors.success },
  dotPaused: { backgroundColor: colors.warning },
  live: { fontSize: 10, color: colors.success, fontWeight: '800', letterSpacing: 1 },
  pet: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 2 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: spacing.xxl, marginTop: spacing.lg },
  value: { color: colors.text, fontSize: 21, fontWeight: '800' },
  caption: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  pause: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  pauseText: { color: colors.textOnPrimary, fontWeight: '800', fontSize: 13 },
  finish: {
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishText: { color: colors.error, fontWeight: '800', fontSize: 13 },
});
