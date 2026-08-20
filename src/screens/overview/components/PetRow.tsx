import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../../../components/ui/Avatar';
import { spacing, typography, radius } from '../../../styles/theme';
import { Pet } from '../../../types';

export function PetRow({ pet }: { pet: Pet }) {
  return (
    <View style={styles.row}>
      <Avatar name={pet.name} uri={pet.avatar_file_id ?? undefined} size={46} />
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{pet.name}</Text>
        <Text style={styles.rowMeta}>{[pet.species, pet.breed].filter(Boolean).join(' · ')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowCopy: { flex: 1 },
  rowTitle: { ...typography.bodyMedium },
  rowMeta: { ...typography.caption, marginTop: spacing.xxs, textTransform: 'capitalize' },
});

export default PetRow;
