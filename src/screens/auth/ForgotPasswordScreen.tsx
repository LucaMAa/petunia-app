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
import { useLocalization } from '../../context/LocalizationContext';

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
  const { t } = useLocalization();

  async function handleSubmit() {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(t('auth.invalid_email'));
      return;
    }
    setEmailError('');
    setIsLoading(true);
    setError(null);
    try {
      await authApi.requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.password_reset_failed'));
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
        <Text style={styles.sentTitle}>{t('auth.check_your_inbox')}</Text>
        <Text style={styles.sentText}>{t('auth.password_reset_instructions')}</Text>
        <Button label={t('auth.back_to_sign_in')} onPress={onBack} variant="outline" />
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
          <Text style={styles.backText}>← {t('auth.back')}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>{t('auth.reset_password')}</Text>
          <Text style={styles.subtitle}>{t('auth.enter_email_reset_link')}</Text>
        </View>

        <View style={styles.form}>
          <ErrorBanner message={error} />
          <TextInput
            label={t('auth.email')}
            placeholder={t('auth.email_placeholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />
          <Button label={t('auth.send_reset_link')} onPress={handleSubmit} loading={isLoading} />
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
