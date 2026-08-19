import React, { useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth }          from '../../context/AuthContext';
import { Button }           from '../../components/ui/Button';
import { TextInput }        from '../../components/ui/TextInput';
import { ErrorBanner }      from '../../components/ui/ErrorBanner';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';

interface Props {
  onNavigateRegister: () => void;
  onNavigateForgot:   () => void;
}

export function LoginScreen({ onNavigateRegister, onNavigateForgot }: Props) {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [errors,    setErrors]    = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim())                     e.email    = 'Email richiesta';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = 'Email non valida';
    if (!password)                         e.password = 'Password richiesta';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsLoading(true); setError(null);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login fallito';
      setError(msg === 'account_disabled' ? 'Il tuo account è stato disabilitato.' : msg);
    } finally { setIsLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🐾</Text>
          </View>
          <Text style={styles.wordmark}>Petunia</Text>
          <Text style={styles.tagline}>Il tuo amico a quattro zampe ti aspetta</Text>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Bentornato 👋</Text>
          <ErrorBanner message={error} />
          <TextInput
            label="Email"
            placeholder="tu@esempio.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            leftElement={<Text style={styles.inputIcon}>✉️</Text>}
          />
          <TextInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={errors.password}
            leftElement={<Text style={styles.inputIcon}>🔒</Text>}
          />
          <TouchableOpacity onPress={onNavigateForgot} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Password dimenticata?</Text>
          </TouchableOpacity>
          <Button label="Accedi" onPress={handleLogin} loading={isLoading} size="lg" />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Non hai un account? </Text>
          <TouchableOpacity onPress={onNavigateRegister}>
            <Text style={styles.footerLink}>Registrati</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow:          1,
    justifyContent:    'center',
    paddingHorizontal: spacing.lg,
    gap:               spacing.lg,
  },
  hero:          { alignItems: 'center', gap: spacing.sm },
  logoContainer: {
    width: 88, height: 88, borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primaryMid,
    ...shadow.brand,
  },
  logoEmoji: { fontSize: 44 },
  wordmark:  { ...typography.display, color: colors.primaryDeep, letterSpacing: -2 },
  tagline:   { ...typography.bodySmall, color: colors.textTertiary, textAlign: 'center' },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius:    radius.xl,
    padding:         spacing.lg,
    gap:             spacing.md,
    borderWidth:     1,
    borderColor:     colors.border,
    ...shadow.md,
  },
  formTitle:  { ...typography.h2, marginBottom: spacing.xs },
  inputIcon:  { fontSize: 16 },
  forgotBtn:  { alignSelf: 'flex-end', marginTop: -spacing.xs },
  forgotText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

  footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.bodySmall },
  footerLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
});
