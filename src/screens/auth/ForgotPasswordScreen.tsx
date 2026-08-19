import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { colors, spacing, typography } from '../../styles/theme';

interface Props {
  onBack: () => void;
}

export function ForgotPasswordScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    setEmailError('');
    setIsLoading(true);
    setError(null);
    try {
      await authApi.requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <View
        style={[
          styles.sentContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <Text style={styles.sentIcon}>📬</Text>
        <Text style={styles.sentTitle}>Check your inbox</Text>
        <Text style={styles.sentText}>
          If an account exists for {email}, you'll receive instructions to reset your password.
        </Text>
        <Button label="Back to sign in" onPress={onBack} variant="outline" />
      </View>
    );
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
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a reset link.
          </Text>
        </View>

        <View style={styles.form}>
          <ErrorBanner message={error} />
          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />
          <Button label="Send reset link" onPress={handleSubmit} loading={isLoading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.xl,
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  header: { gap: spacing.sm },
  icon: { fontSize: 48 },
  title: { ...typography.h1 },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { gap: spacing.md },
  sentContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  sentIcon: { fontSize: 64 },
  sentTitle: { ...typography.h2 },
  sentText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
