import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  variant?: 'default' | 'tinted' | 'outlined' | 'ghost' | 'brand' | 'medical';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  elevated = false,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        elevated && variant !== 'ghost' && shadow.sm,
        padding !== 'none' && paddingStyles[padding],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, overflow: 'hidden' },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tinted: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: { backgroundColor: 'transparent' },
  brand: { backgroundColor: colors.primary },
  medical: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
});
const paddingStyles = StyleSheet.create({
  xs: { padding: spacing.xs },
  sm: { padding: spacing.sm },
  md: { padding: spacing.lg },
  lg: { padding: spacing.xl },
});
