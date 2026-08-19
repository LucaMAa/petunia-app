import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Family } from '../../types';
import { familiesApi } from '../../api/families';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';

interface Props {
  visible: boolean;
  petId: string;
  onSelect: (family: Family) => void;
  onClose: () => void;
}

export function FamilyPickerModal({ visible, petId, onSelect, onClose }: Props) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    load();
  }, [visible, petId]);

  async function load() {
    setIsLoading(true);
    try {
      const all = await familiesApi.list();
      const filtered = (all ?? []).filter(
        f => f.pets?.some(p => p.id === petId)
      );
      setFamilies(filtered);
    } catch {
      setFamilies([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Scegli famiglia</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          In quale famiglia vuoi gestire i promemoria?
        </Text>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : families.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>Nessuna famiglia</Text>
            <Text style={styles.emptyText}>
              Questo animale non è assegnato ad alcuna famiglia.
            </Text>
            <Text style={styles.emptyHint}>
              Vai in Famiglia, assegna l&apos;animale e riprova.
            </Text>
          </View>
        ) : (
          <FlatList
            data={families}
            keyExtractor={f => f.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                activeOpacity={0.8}
                style={styles.familyRow}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.houseEmoji}>🏠</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.familyName}>{item.name}</Text>
                  <Text style={styles.familyMeta}>
                    {`${item.members?.length ?? 0} membri`}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title:    { ...typography.h2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.primaryDeep, fontWeight: '700' },

  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  list: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingTop: spacing.sm },

  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.xs,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseEmoji: { fontSize: 26 },
  info:       { flex: 1 },
  familyName: { ...typography.h4 },
  familyMeta: { ...typography.caption, color: colors.textMuted },
  arrow:      { fontSize: 22, color: colors.textMuted, fontWeight: '300' },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyIcon:  { fontSize: 56 },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptyText:  {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
