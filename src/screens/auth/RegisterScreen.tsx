import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { colors, spacing, typography } from '../../styles/theme';

interface Props {
  onNavigateLogin: () => void;
  onSuccess: () => void;
}

interface FormState {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export function RegisterScreen({ onNavigateLogin, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FormState>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function set(field: keyof FormState) {
    return (value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.confirm_password !== form.password) e.confirm_password = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      Alert.alert('Account created!', 'You can now sign in.', [
        { text: 'Sign in', onPress: onSuccess },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      if (msg.includes('already')) setError('An account with this email already exists.');
      else setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🐾</Text>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Petunia today</Text>
        </View>

        <View style={styles.form}>
          <ErrorBanner message={error} />

          <View style={styles.row}>
            <View style={styles.half}>
              <TextInput
                label="First name"
                placeholder="Ada"
                value={form.first_name}
                onChangeText={set('first_name')}
                autoComplete="given-name"
                error={errors.first_name}
              />
            </View>
            <View style={styles.half}>
              <TextInput
                label="Last name"
                placeholder="Lovelace"
                value={form.last_name}
                onChangeText={set('last_name')}
                autoComplete="family-name"
                error={errors.last_name}
              />
            </View>
          </View>

          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={set('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />

          <TextInput
            label="Password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChangeText={set('password')}
            isPassword
            hint="At least 8 characters"
            error={errors.password}
          />

          <TextInput
            label="Confirm password"
            placeholder="Repeat password"
            value={form.confirm_password}
            onChangeText={set('confirm_password')}
            isPassword
            error={errors.confirm_password}
          />

          <Button label="Create account" onPress={handleRegister} loading={isLoading} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onNavigateLogin}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  header: { alignItems: 'center', gap: spacing.sm },
  logo: { fontSize: 56 },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodySmall },
  form: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { ...typography.bodySmall },
  footerLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
});
