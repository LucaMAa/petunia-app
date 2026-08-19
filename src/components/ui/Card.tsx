import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow } from '../../styles/theme';

interface CardProps {
  children:  React.ReactNode;
  style?:    ViewStyle;
  elevated?: boolean;
  variant?:  'default' | 'tinted' | 'outlined' | 'ghost' | 'brand';
  padding?:  'none' | 'xs' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  elevated = true,
  variant  = 'default',
  padding  = 'md',
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        elevated && variant !== 'ghost' && shadow.sm,
        variant === 'brand' && shadow.brand,
        padding !== 'none' && paddingStyles[padding],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow:     'hidden',
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  tinted: {
    backgroundColor: colors.primaryLight,
    borderWidth:     1,
    borderColor:     colors.primaryMid,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth:     1.5,
    borderColor:     colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth:     0,
  },
  brand: {
    backgroundColor: colors.primary,
    borderWidth:     0,
  },
});

const paddingStyles = StyleSheet.create({
  xs: { padding: spacing.xs },
  sm: { padding: spacing.sm },
  md: { padding: spacing.md },
  lg: { padding: spacing.lg },
});
