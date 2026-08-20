import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { spacing, typography, colors } from '../../../styles/theme';

export function Header({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3 },
  action: { ...typography.label, color: colors.primary },
});

export default Header;
