import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { activitiesApi } from '../../api/activities';
import { Activity } from '../../types';
import { colors, radius, spacing, typography } from '../../styles/theme';

const labels = {
  walk: 'Passeggiata',
  run: 'Corsa',
  hike: 'Escursione',
  park: 'Giro al parco',
  free: 'Attività libera',
};
const duration = (seconds: number) => `${Math.floor(seconds / 60)} min`;

function formatDay(date: Date) {
  return new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(date).replace('.', '');
}
function formatDistance(distance: number) {
  const kilometers = distance / 1000;
  return `${kilometers.toLocaleString('it-IT', {
    minimumFractionDigits: kilometers < 1 ? 2 : 0,
    maximumFractionDigits: kilometers < 1 ? 2 : 1,
  })} km`;
}

function WeeklyDistanceChart({ activities }: { activities: Activity[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sums = new Map<string, number>();
    activities.forEach((activity) => {
      const date = new Date(activity.started_at);
      if (Number.isNaN(date.getTime())) return;
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().slice(0, 10);
      sums.set(key, (sums.get(key) ?? 0) + (Number(activity.distance_m) || 0));
    });
    return Array.from({ length: 7 }, (_, reverseIndex) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - reverseIndex));
      const key = date.toISOString().slice(0, 10);
      return { date, distance: sums.get(key) ?? 0 };
    });
  }, [activities]);
  const maxDistance = Math.max(...days.map((day) => day.distance), 1000);
  const selected = selectedIndex === null ? null : days[selectedIndex];
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartLabel}>KM PERCORSI</Text>
          <Text style={styles.chartTitle}>Ultimi 7 giorni</Text>
        </View>
        <Text style={styles.chartScale}>
          {(maxDistance / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} km
        </Text>
      </View>
      {selected ? (
        <Text style={styles.tooltip}>
          {selected.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} —{' '}
          {formatDistance(selected.distance)}
        </Text>
      ) : (
        <Text style={styles.chartHint}>
          {days.some((day) => day.distance > 0)
            ? 'Tocca una barra per i dettagli'
            : 'Nessuna attività negli ultimi 7 giorni'}
        </Text>
      )}
      <View style={styles.chartPlot}>
        {days.map((day, index) => {
          const height = day.distance ? Math.max(8, (day.distance / maxDistance) * 100) : 2;
          return (
            <Pressable
              key={day.date.toISOString()}
              onPress={() => setSelectedIndex(index)}
              accessibilityLabel={`${formatDay(day.date)}: ${formatDistance(day.distance)}`}
              style={styles.barColumn}
            >
              <View
                style={[styles.bar, { height }, selectedIndex === index && styles.barSelected]}
              />
              <Text style={styles.barLabel}>{formatDay(day.date)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
export function ActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Activity | null>(null);
  const routeMapRef = useRef<MapView>(null);
  useEffect(() => {
    setLoading(true);
    setError(null);
    activitiesApi
      .list()
      .then((data) => {
        setActivities(data);
      })
      .catch((e: unknown) => {
        console.error('ActivitiesScreen: failed to load activities', e);
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!selected) return;
    console.debug(
      'ActivitiesScreen: selected activity',
      selected.id,
      'points:',
      selected.points?.length ?? 0,
    );
  }, [selected]);

  const hasValidPoints =
    !!selected &&
    Array.isArray(selected.points) &&
    selected.points.length >= 2 &&
    selected.points.every((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  const routeCoordinates = hasValidPoints
    ? (selected?.points ?? []).map((point) => ({ latitude: point.lat, longitude: point.lng }))
    : [];

  if (selected) {
    return (
      <View style={styles.page}>
        <View style={styles.detail}>
          <View style={styles.backRow}>
            <Pressable onPress={() => setSelected(null)} style={styles.back}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
              <Text style={styles.backText}>Le tue attività</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!selected) return;
                Alert.alert(
                  'Elimina attività',
                  'Questa attività e il relativo percorso verranno eliminati.',
                  [
                    { text: 'Annulla', style: 'cancel' },
                    {
                      text: 'Elimina',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await activitiesApi.cancel(selected.id);
                          setActivities((cur) => cur.filter((a) => a.id !== selected.id));
                          setSelected(null);
                        } catch (e) {
                          console.error('Failed to delete activity', e);
                        }
                      },
                    },
                  ],
                );
              }}
              style={styles.more}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
            </Pressable>
          </View>
          {hasValidPoints ? (
            <View style={styles.routePreview}>
              <MapView
                ref={routeMapRef}
                style={styles.routePreviewMap}
                initialRegion={{
                  ...routeCoordinates[0],
                  latitudeDelta: 0.012,
                  longitudeDelta: 0.012,
                }}
                onMapReady={() =>
                  routeMapRef.current?.fitToCoordinates(routeCoordinates, {
                    edgePadding: { top: 36, right: 36, bottom: 36, left: 36 },
                    animated: false,
                  })
                }
                scrollEnabled
                zoomEnabled
                rotateEnabled
                pitchEnabled
                showsCompass
                toolbarEnabled={false}
              >
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor={colors.primary}
                  strokeWidth={5}
                />
                <Marker
                  coordinate={routeCoordinates[0]}
                  pinColor={colors.success}
                  title="Partenza"
                />
                <Marker
                  coordinate={routeCoordinates[routeCoordinates.length - 1]}
                  pinColor={colors.error}
                  title="Arrivo"
                />
              </MapView>
            </View>
          ) : (
            <View style={styles.routePreview}>
              <Text style={styles.routeCaption}>Percorso non disponibile</Text>
            </View>
          )}
          <Text style={styles.detailTitle}>{labels[selected.type]}</Text>
          <Text style={styles.detailDate}>
            {new Date(selected.started_at).toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <View style={styles.detailStats}>
            <Metric label="DISTANZA" value={`${(selected.distance_m / 1000).toFixed(2)} km`} />
            <Metric label="DURATA" value={duration(selected.duration_s)} />
            <Metric label="COMPAGNO" value={selected.pet?.name ?? '—'} />
          </View>
        </View>
      </View>
    );
  }
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>IL TUO DIARIO</Text>
      <Text style={styles.title}>Le tue attività</Text>
      <WeeklyDistanceChart activities={activities} />
      <Text style={styles.section}>Recenti</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : error ? (
        <View>
          <Text style={styles.empty}>Non è stato possibile caricare le tue attività.</Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              setError(null);
              activitiesApi
                .list()
                .then(setActivities)
                .catch((e) => setError(e instanceof Error ? e.message : String(e)))
                .finally(() => setLoading(false));
            }}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: colors.primary, fontWeight: '800' }}>Riprova</Text>
          </Pressable>
        </View>
      ) : activities.length ? (
        activities.map((activity) => (
          <Pressable
            key={activity.id}
            style={styles.card}
            onPress={() =>
              activitiesApi
                .get(activity.id)
                .then((a) => {
                  setSelected(a);
                })
                .catch(() => setSelected(activity))
            }
          >
            <View style={styles.activityIcon}>
              <Ionicons name="walk-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{labels[activity.type]}</Text>
              <Text style={styles.cardMeta}>
                {activity.pet?.name ?? 'Attività privata'} ·{' '}
                {new Date(activity.started_at).toLocaleDateString('it-IT')}
              </Text>
            </View>
            <View>
              <Text style={styles.cardValue}>{(activity.distance_m / 1000).toFixed(2)} km</Text>
              <Text style={styles.cardMeta}>{duration(activity.duration_s)}</Text>
            </View>
          </Pressable>
        ))
      ) : (
        <Text style={styles.empty}>La tua prossima passeggiata inizierà qui.</Text>
      )}
    </ScrollView>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  eyebrow: { ...typography.overline },
  title: { ...typography.h1 },
  chartCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.sm,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  chartLabel: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  chartTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 2 },
  chartScale: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  chartHint: { minHeight: 20, color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  tooltip: {
    minHeight: 20,
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  chartPlot: {
    height: 132,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMid,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  barColumn: {
    width: 30,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  bar: {
    width: 18,
    borderTopLeftRadius: radius.xs,
    borderTopRightRadius: radius.xs,
    backgroundColor: colors.primaryMid,
  },
  barSelected: { backgroundColor: colors.primary },
  barLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  section: { ...typography.h3, marginTop: spacing.md },
  card: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
  },
  cardTitle: { ...typography.bodyMedium, fontWeight: '700' },
  cardMeta: { ...typography.caption, marginTop: 3 },
  cardValue: { color: colors.text, fontWeight: '800', fontSize: 13, textAlign: 'right' },
  empty: { ...typography.bodySmall, color: colors.textMuted, paddingTop: spacing.md },
  detail: { padding: spacing.xl, gap: spacing.md },
  back: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  backText: { ...typography.label },
  backRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  more: { padding: spacing.sm },
  routePreview: {
    height: 220,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routePreviewMap: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceAlt,
  },
  routeCaption: { ...typography.caption },
  detailTitle: { ...typography.h1, marginTop: spacing.md },
  detailDate: { ...typography.bodySmall },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.lg,
    marginTop: spacing.md,
  },
  metricValue: { color: colors.text, fontWeight: '800', fontSize: 16 },
  metricLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', marginTop: 3 },
});
