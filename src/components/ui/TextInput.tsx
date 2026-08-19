import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  Animated,
} from 'react-native';
import { colors, radius, spacing, typography, layout, shadow } from '../../styles/theme';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  isPassword?: boolean;
}

export function TextInput({
  label,
  error,
  hint,
  containerStyle,
  rightElement,
  leftElement,
  isPassword = false,
  style,
  ...rest
}: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function handleFocus() {
    setFocused(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }

  function handleBlur() {
    setFocused(false);
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.error : colors.border,
      error ? colors.error : colors.borderFocus,
    ],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.errorLight : colors.surface,
      error ? '#FFF5F5' : '#FFF8F4',
    ],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, focused && styles.labelFocused]}>
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: bgColor,
          },
          focused && shadow.xs,
        ]}
      >
        {leftElement && (
          <View style={styles.leftEl}>{leftElement}</View>
        )}

        <RNTextInput
          style={[styles.input, leftElement ? styles.inputWithLeft : undefined, style]} 
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !visible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize={isPassword ? 'none' : rest.autoCapitalize}
          autoCorrect={isPassword ? false : rest.autoCorrect}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setVisible(v => !v)}
            style={styles.eyeBtn}
            hitSlop={8}
          >
            <Text style={styles.eyeText}>{visible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        ) : rightElement ? (
          <View style={styles.rightEl}>{rightElement}</View>
        ) : null}
      </Animated.View>

      {!!error && (
        <View style={styles.feedbackRow}>
          <Text style={styles.errorDot}>●</Text>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
      {!error && !!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },

  label: {
    ...typography.label,
    marginBottom: 2,
    color: colors.textTertiary,
  },
  labelFocused: {
    color: colors.primaryDeep,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.inputHeight,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },

  input: {
    flex: 1,
    height: '100%',
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
  },
  inputWithLeft: {
    paddingLeft: spacing.xs,
  },

  leftEl: { marginRight: spacing.xs },
  rightEl: { marginLeft: spacing.xs },

  eyeBtn: {
    padding: 4,
    marginLeft: spacing.xs,
  },
  eyeText: { fontSize: 16 },

  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  errorDot: {
    fontSize: 6,
    color: colors.error,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
