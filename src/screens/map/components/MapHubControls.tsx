import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../../../styles/theme';
import { ReportType } from '../../../types';

export type MapFilter = 'all' | 'safety' | 'walks' | 'services';
const filters: { key: MapFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'Tutto', icon: 'grid-outline' },
  { key: 'safety', label: 'Sicurezza', icon: 'warning-outline' },
  { key: 'walks', label: 'Passeggiate', icon: 'paw-outline' },
  { key: 'services', label: 'Servizi', icon: 'medkit-outline' },
];

export function MapHubControls({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  onLocate,
  onReport,
  onActivity,
  activeActivity,
  mapMode,
  onMapModeChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filter: MapFilter;
  onFilterChange: (filter: MapFilter) => void;
  onLocate: () => void;
  onReport: () => void;
  onActivity: () => void;
  activeActivity: boolean;
  mapMode: 'explore' | 'report';
  onMapModeChange: (nextMode: 'explore' | 'report') => void;
}) {
  if (activeActivity) {
    return (
      <View style={styles.liveControls} pointerEvents="none">
        <View style={styles.liveLabel} pointerEvents="auto">
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>ATTIVITÀ IN CORSO</Text>
        </View>
        <TouchableOpacity
          style={styles.roundButton}
          onPress={onLocate}
          accessibilityLabel="Torna alla mia posizione"
        >
          <Ionicons name="locate" color={colors.primary} size={21} />
        </TouchableOpacity>
      </View>
    );
  }

  const isReportMode = mapMode === 'report';

  if (isReportMode) {
    return (
      <View style={styles.reportModeWrap} pointerEvents="box-none">
        <View style={styles.reportModeBar} pointerEvents="auto">
          <TouchableOpacity
            style={styles.reportModeToggle}
            onPress={() => onMapModeChange('explore')}
            accessibilityLabel="Esci dalla modalità segnalazione"
          >
            <Ionicons name="close" color={colors.textOnPrimary} size={18} />
          </TouchableOpacity>
          <View style={styles.reportModeLabelWrap}>
            <Text style={styles.reportModeTitle}>Modalità punto</Text>
            <Text style={styles.reportModeText}>Tocca la mappa per scegliere il punto</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.controlsStack} pointerEvents="auto">
        <View style={styles.topRow}>
          <View style={styles.searchRow} pointerEvents="auto">
            <Ionicons name="search" color={colors.textMuted} size={20} />
            <TextInput
              value={query}
              onChangeText={onQueryChange}
              placeholder="Cerca area cani, veterinario, pericolo…"
              placeholderTextColor={colors.textMuted}
              style={styles.search}
              returnKeyType="search"
              accessibilityLabel="Cerca sulla mappa"
            />
            {query ? (
              <TouchableOpacity
                onPress={() => onQueryChange('')}
                accessibilityLabel="Cancella ricerca"
              >
                <Ionicons name="close-circle" color={colors.textMuted} size={20} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={onActivity}
              style={styles.toolbarIconPrimary}
              accessibilityLabel="Inizia attività"
            >
              <Ionicons name="walk" color={colors.textOnPrimary} size={19} />
            </TouchableOpacity>
          </View>
          <View style={styles.modeSwitch} pointerEvents="auto">
            <TouchableOpacity
              style={[styles.modeOption, styles.modeOptionActive]}
              onPress={() => onMapModeChange('explore')}
              accessibilityLabel="Modalità esplora"
            >
              <Ionicons name="search-outline" size={15} color={colors.textOnPrimary} />
              <Text style={[styles.modeText, styles.modeTextActive]}>Esplora</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modeOption}
              onPress={onReport}
              accessibilityLabel="Modalità punti sulla mappa"
            >
              <Ionicons name="pin-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.modeText}>Punto</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          pointerEvents="auto"
        >
          {filters.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => onFilterChange(item.key)}
              style={[styles.filter, filter === item.key && styles.filterActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item.key }}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={filter === item.key ? colors.textOnPrimary : colors.textSecondary}
              />
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.actions} pointerEvents="auto">
        <TouchableOpacity
          style={styles.roundButton}
          onPress={onLocate}
          accessibilityLabel="Centra sulla mia posizione"
        >
          <Ionicons name="locate" color={colors.primary} size={21} />
        </TouchableOpacity>
      </View>
    </>
  );
}

export function NearbySummary({ count, filter }: { count: number; filter: MapFilter }) {
  const label =
    filter === 'safety'
      ? 'avvisi di sicurezza'
      : filter === 'walks'
        ? 'luoghi per passeggiare'
        : filter === 'services'
          ? 'servizi utili'
          : 'luoghi e segnalazioni';
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryTitle}>Cosa c’è qui intorno?</Text>
      <Text style={styles.summaryText}>
        {count ? `${count} ${label} vicino a te` : 'Esplora la zona o segnala un posto utile'}
      </Text>
    </View>
  );
}

export function reportMatchesFilter(type: ReportType, filter: MapFilter) {
  if (filter === 'all') return true;
  if (filter === 'safety') return type === 'poisoned_bait' || type === 'danger';
  if (filter === 'walks') return type === 'dog_area' || type === 'interesting';
  return type === 'vet';
}

const styles = StyleSheet.create({
  controlsStack: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeSwitch: {
    width: 150,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderMid,
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    ...shadow.sm,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: radius.pill,
  },
  modeOptionActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.textOnPrimary,
  },
  searchRow: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderMid,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.md,
  },
  search: { flex: 1, color: colors.text, fontSize: 14, height: '100%' },
  toolbarIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarIconPrimary: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  filters: {
    paddingHorizontal: 0,
    gap: spacing.sm,
  },
  filter: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: colors.textOnPrimary },
  actions: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
    zIndex: 10,
    alignItems: 'center',
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  reportModeWrap: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  reportModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.md,
  },
  reportModeToggle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModeLabelWrap: { flex: 1 },
  reportModeTitle: { color: colors.text, fontWeight: '800', fontSize: 12 },
  reportModeText: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  liveControls: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  liveLabel: {
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.borderMid,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    ...shadow.sm,
  },
  liveDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.success },
  liveText: { color: colors.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  summary: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.lg,
    right: 84,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.sm,
    zIndex: 10,
  },
  summaryTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  summaryText: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
});
