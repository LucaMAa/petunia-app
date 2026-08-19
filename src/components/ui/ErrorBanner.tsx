import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../styles/theme';

interface ErrorBannerProps {
  message: string | null;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <View style={styles.accent} />
      <View style={styles.inner}>
        <Text style={styles.icon}>⚠</Text>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    backgroundColor: colors.errorLight,
    borderRadius:   radius.md,
    borderWidth:    1,
    borderColor:    '#F0CECE',
    overflow:       'hidden',
  },
  accent: {
    width:           4,
    backgroundColor: colors.error,
  },
  inner: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.xs,
    padding:       spacing.sm,
    paddingLeft:   spacing.md,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    ...typography.bodySmall,
    color: colors.error,
    flex:  1,
  },
});
