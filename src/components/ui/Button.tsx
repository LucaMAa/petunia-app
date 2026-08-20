import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { animation, colors, layout, radius, shadow, spacing, typography } from '../../styles/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  accessibilityLabel?: string;
  withShadow?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
  icon,
  iconRight,
  accessibilityLabel,
  withShadow = true,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const inactive = disabled || loading;
  const press = (value: number) =>
    Animated.timing(scale, {
      toValue: value,
      duration: animation.fast,
      useNativeDriver: true,
    }).start();
  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        styles.shadowWrap,
        withShadow && variant === 'primary' && shadow.brand,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPress={onPress}
        onPressIn={() => !inactive && press(0.98)}
        onPressOut={() => press(1)}
        style={({ pressed }) => [
          styles.base,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && styles.fullWidth,
          pressed && !inactive && styles.pressed,
          inactive && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={
              variant === 'ghost' || variant === 'outline' || variant === 'secondary'
                ? colors.primary
                : colors.textOnPrimary
            }
          />
        ) : (
          <View style={styles.content}>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Text style={[styles.text, textVariants[variant], textSizes[size], textStyle]}>
              {label}
            </Text>
            {iconRight ? <View style={styles.icon}>{iconRight}</View> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: { borderRadius: radius.md },
  fullWidth: { width: '100%' },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    minWidth: layout.minTouchTarget,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: { alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center' },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.48 },
});
const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },
  gold: { backgroundColor: colors.accent },
});
const sizeStyles = StyleSheet.create({
  sm: { height: layout.buttonHeightSm, paddingHorizontal: spacing.md },
  md: { height: layout.buttonHeightMd, paddingHorizontal: spacing.lg },
  lg: { height: layout.buttonHeightLg, paddingHorizontal: spacing.xl },
});
const textVariants = StyleSheet.create({
  primary: { color: colors.textOnPrimary },
  secondary: { color: colors.primaryDeep },
  outline: { color: colors.primaryDeep },
  ghost: { color: colors.primary },
  danger: { color: colors.textOnPrimary },
  gold: { color: colors.textOnPrimary },
});
const textSizes = StyleSheet.create({
  sm: { ...typography.label, fontSize: 12 },
  md: { ...typography.bodyMedium, fontSize: 14 },
  lg: { ...typography.bodyMedium, fontSize: 16, fontWeight: '600' },
});
