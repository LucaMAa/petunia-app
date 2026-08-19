import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { colors, radius, typography, spacing, layout, shadow } from '../../styles/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label:       string;
  onPress:     () => void;
  variant?:    Variant;
  size?:       Size;
  loading?:    boolean;
  disabled?:   boolean;
  style?:      ViewStyle;
  textStyle?:  TextStyle;
  fullWidth?:  boolean;
  icon?:       React.ReactNode;
  iconRight?:  React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant    = 'primary',
  size       = 'md',
  loading    = false,
  disabled   = false,
  style,
  textStyle,
  fullWidth  = true,
  icon,
  iconRight,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.965,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }

  const variantStyle  = variantStyles[variant];
  const sizeStyle     = sizeStyles[size];
  const textV         = textVariants[variant];
  const textS         = textSizes[size];

  return (
    <Animated.View
      style={[
        fullWidth && { width: '100%' },
        variant === 'primary' && shadow.brand,
        variant === 'secondary' && shadow.sm,
        variant === 'danger' && styles.dangerShadow,
        { transform: [{ scale }] },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
        style={[
          styles.base,
          variantStyle,
          sizeStyle,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={
              variant === 'outline' || variant === 'ghost'
                ? colors.primary
                : colors.textOnPrimary
            }
            size="small"
          />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={[styles.text, textV, textS, textStyle]}>
              {label}
            </Text>
            {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems:   'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  content: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  iconLeft:  {},
  iconRight: {},
  text: {
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  disabled:     { opacity: 0.42 },
  dangerShadow: {
    shadowColor:   '#B83232',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius:  12,
    elevation: 6,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
    borderWidth:     1.5,
    borderColor:     colors.primaryMid,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth:     1.5,
    borderColor:     colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth:     0,
  },
  danger: {
    backgroundColor: colors.error,
    borderWidth:     0,
  },
  gold: {
    backgroundColor: colors.accent,
    borderWidth:     0,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    height:          layout.buttonHeightSm,
    paddingHorizontal: spacing.md,
  },
  md: {
    height:          layout.buttonHeightMd,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    height:          layout.buttonHeightLg,
    paddingHorizontal: spacing.xl,
  },
});

const textVariants = StyleSheet.create({
  primary:   { color: colors.textOnPrimary },
  secondary: { color: colors.primaryDeep },
  outline:   { color: colors.primary },
  ghost:     { color: colors.primary },
  danger:    { color: colors.textOnPrimary },
  gold:      { color: '#FFF8ED' },
});

const textSizes = StyleSheet.create({
  sm: { ...typography.body, fontSize: 13, fontWeight: '600' },
  md: { ...typography.body, fontSize: 15, fontWeight: '600' },
  lg: { ...typography.body, fontSize: 16, fontWeight: '700' },
});
