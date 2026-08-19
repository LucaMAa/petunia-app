import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  ViewStyle,
} from "react-native";
import {
  colors,
  layout,
  radius,
  spacing,
  typography,
} from "../../styles/theme";

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  isPassword?: boolean;
  required?: boolean;
}

export function TextInput({
  label,
  error,
  hint,
  containerStyle,
  rightElement,
  leftElement,
  isPassword = false,
  required = false,
  style,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const handleFocus: RNTextInputProps["onFocus"] = (event) => {
    setFocused(true);
    onFocus?.(event);
  };
  const handleBlur: RNTextInputProps["onBlur"] = (event) => {
    setFocused(false);
    onBlur?.(event);
  };
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, focused && styles.labelFocused]}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.focused,
          !!error && styles.invalid,
          !editable && styles.disabled,
        ]}
      >
        {leftElement ? <View style={styles.left}>{leftElement}</View> : null}
        <RNTextInput
          {...rest}
          style={[styles.input, style]}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !visible}
          autoCapitalize={isPassword ? "none" : rest.autoCapitalize}
          autoCorrect={isPassword ? false : rest.autoCorrect}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              visible ? "Nascondi password" : "Mostra password"
            }
            hitSlop={8}
            onPress={() => setVisible((value) => !value)}
            style={styles.passwordToggle}
          >
            <Text style={styles.passwordToggleText}>
              {visible ? "Nascondi" : "Mostra"}
            </Text>
          </Pressable>
        ) : rightElement ? (
          <View style={styles.right}>{rightElement}</View>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary },
  labelFocused: { color: colors.primary },
  required: { color: colors.error },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: layout.inputHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  focused: {
    borderColor: colors.borderFocus,
    borderWidth: 2,
    paddingHorizontal: spacing.sm + 2,
  },
  invalid: { borderColor: colors.error, backgroundColor: colors.errorLight },
  disabled: { opacity: 0.6, backgroundColor: colors.surfaceMuted },
  input: {
    flex: 1,
    height: "100%",
    ...typography.body,
    paddingVertical: 0,
    color: colors.text,
  },
  left: { marginRight: spacing.sm },
  right: { marginLeft: spacing.sm },
  passwordToggle: { padding: spacing.xs, marginLeft: spacing.sm },
  passwordToggleText: { ...typography.label, color: colors.primary },
  error: { ...typography.caption, color: colors.error },
  hint: { ...typography.caption, color: colors.textTertiary },
});
