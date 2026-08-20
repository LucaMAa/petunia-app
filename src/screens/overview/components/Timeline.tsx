import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, colors, radius } from '../../../styles/theme';

export function Timeline({
  icon,
  title,
  text,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>{text}</Text>
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
  rowLast: { borderBottomWidth: 0 },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1 },
  rowTitle: { ...typography.bodyMedium },
  rowMeta: { ...typography.caption, marginTop: spacing.xxs },
});

export default Timeline;
