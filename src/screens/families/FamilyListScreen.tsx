import React, { useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Family } from '../../types';
import { useFamilies } from '../../hooks/useFamilies';
import { Card } from '../../components/ui/Card';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';

interface Props {
  onCreateFamily: () => void;
  onSelectFamily: (family: Family) => void;
  onOpenInvites: () => void;
}

export function FamilyListScreen({ onCreateFamily, onSelectFamily, onOpenInvites }: Props) {
  const insets = useSafeAreaInsets();
  const { families, isLoading, error, load, remove } = useFamilies();

  useEffect(() => { load(); }, [load]);

  function confirmDelete(family: Family) {
    Alert.alert(`Eliminare "${family.name}"?`, 'Questa azione non può essere annullata.', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => remove(family.id) },
    ]);
  }

  if (isLoading && families.length === 0) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <FlatList
        data={families}
        keyExtractor={f => f.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.primary} />
        }
        ListHeaderComponent={() => (
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.overline}>I tuoi gruppi</Text>
                <Text style={styles.title}>Le mie famiglie</Text>
              </View>
              <TouchableOpacity onPress={onCreateFamily} style={styles.addBtn}>
                <Text style={styles.addBtnText}>＋ Nuova</Text>
              </TouchableOpacity>
            </View>

            {/* Invites shortcut */}
            <TouchableOpacity onPress={onOpenInvites} style={styles.invitesRow} activeOpacity={0.8}>
              <View style={styles.invitesIconBox}>
                <Text style={{ fontSize: 18 }}>✉️</Text>
              </View>
              <Text style={styles.invitesLabel}>Gestisci inviti</Text>
              <Text style={styles.invitesArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={!isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>Nessuna famiglia</Text>
            <Text style={styles.emptyText}>Crea la tua prima famiglia per condividere i tuoi animali!</Text>
            <TouchableOpacity onPress={onCreateFamily} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>＋ Crea famiglia</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        renderItem={({ item }) => {
          const memberCount = item.members?.length ?? 0;
          return (
            <TouchableOpacity onPress={() => onSelectFamily(item)} activeOpacity={0.8}>
              <Card style={styles.card}>
                <View style={styles.cardIconBox}>
                  <Text style={styles.cardIcon}>🏠</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardMeta}>
                    {memberCount} {memberCount === 1 ? 'membro' : 'membri'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(item)}
                  style={styles.deleteBtn}
                  hitSlop={8}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </Card>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing.xxl },
          families.length === 0 && { flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list:    { paddingHorizontal: spacing.lg },
  header:  {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  overline: { ...typography.overline },
  title:    { ...typography.h1 },
  addBtn:   {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    ...shadow.brand,
  },
  addBtnText: { color: colors.textOnPrimary, fontWeight: '700' },

  invitesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...shadow.xs,
  },
  invitesIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitesLabel: { ...typography.bodyMedium, flex: 1 },
  invitesArrow: { ...typography.h3, color: colors.textMuted },

  card:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  cardIconBox:{
    width: 48, height: 48, borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIcon:  { fontSize: 24 },
  cardInfo:  { flex: 1 },
  cardName:  { ...typography.h4 },
  cardMeta:  { ...typography.caption, color: colors.textMuted },
  deleteBtn: {
    width: 28, height: 28, borderRadius: radius.xs,
    backgroundColor: colors.errorLight,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteText: { color: colors.error, fontSize: 13, fontWeight: '700' },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyIcon:  { fontSize: 56 },
  emptyTitle: { ...typography.h2, textAlign: 'center' },
  emptyText:  { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  emptyBtn:   {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    borderRadius: radius.pill, ...shadow.brand,
  },
  emptyBtnText: { color: colors.textOnPrimary, fontWeight: '700' },
});
