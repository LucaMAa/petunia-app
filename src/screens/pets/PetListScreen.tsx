import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pet } from '../../types';
import { usePets } from '../../hooks/usePets';
import { PetCard } from '../../components/ui/PetCard';

import { colors, spacing, typography, radius, shadow } from '../../styles/theme';

interface Props {
  onCreatePet: () => void;
  onSelectPet: (pet: Pet) => void;
}

export function PetListScreen({ onCreatePet, onSelectPet }: Props) {
  const insets = useSafeAreaInsets();

  const { pets, isLoading, error, load, remove } = usePets();

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(
    (pet: Pet) => {
      Alert.alert(
        `Rimuovere ${pet.name}?`,
        'Questa azione non può essere annullata.',
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Elimina',
            style: 'destructive',
            onPress: () => remove(pet.id),
          },
        ]
      );
    },
    [remove]
  );

  if (isLoading && pets.length === 0) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  const renderHeader = () => (
    <>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.overline}>I tuoi amici</Text>
          <Text style={styles.title}>I miei animali</Text>
        </View>

        <TouchableOpacity onPress={onCreatePet} style={styles.addBtn}>
          <Text style={styles.addBtnText}>＋ Aggiungi</Text>
        </TouchableOpacity>
      </View>

      {/* ERROR */}
      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {/* COUNT */}
      {pets.length > 0 && (
        <View style={styles.countRow}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {pets.length} {pets.length === 1 ? 'animale' : 'animali'}
            </Text>
          </View>
        </View>
      )}
    </>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIconBox}>
        <Text style={styles.emptyIcon}>🐾</Text>
      </View>

      <Text style={styles.emptyTitle}>Nessun animale ancora</Text>
      <Text style={styles.emptyText}>
        Aggiungi il tuo primo amico peloso per iniziare!
      </Text>

      <TouchableOpacity onPress={onCreatePet} style={styles.emptyBtn}>
        <Text style={styles.emptyBtnText}>＋ Aggiungi animale</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <FlatList
        data={pets}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PetCard
            pet={item}
            onPress={() => onSelectPet(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing.xxl },
          pets.length === 0 && styles.listEmptyFix,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={load}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },

  overline: {
    ...typography.overline,
  },

  title: {
    ...typography.h1,
  },

  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    ...shadow.brand,
  },

  addBtnText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },

  countRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },

  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },

  countText: {
    ...typography.caption,
    color: colors.primaryDeep,
    fontWeight: '700',
  },

  list: {
    paddingHorizontal: spacing.lg,
  },

  listEmptyFix: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F0CECE',
  },

  errorText: {
    ...typography.bodySmall,
    color: colors.error,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },

  emptyIconBox: {
    width: 110,
    height: 110,
    borderRadius: radius.xxl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryMid,
  },

  emptyIcon: {
    fontSize: 56,
  },

  emptyTitle: {
    ...typography.h2,
    textAlign: 'center',
  },

  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    ...shadow.brand,
  },

  emptyBtnText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
});
