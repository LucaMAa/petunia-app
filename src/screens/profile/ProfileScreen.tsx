import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAlert } from '../../components/ui/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { profileApi } from '../../api/profile';
import { uploadApi } from '../../api/uploads';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import { AvatarPicker } from '../../components/ui/AvatarPicker';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { colors, spacing, typography } from '../../styles/theme';

type Section = 'view' | 'editProfile' | 'changePassword' | 'changeEmail';

export function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section>('view');
  const { showAlert } = useAlert();

  if (!user) return null;

  function goTo(s: Section) {
    return () => setSection(s);
  }

  const fullName = `${user.first_name} ${user.last_name}`;
  const avatarUrl = user.avatar?.id ?? user.avatar_file_id ?? user.avatar?.url ?? '';

  async function handleAvatarPick(uri: string, fileName: string, mimeType: string) {
    await uploadApi.userAvatar(uri, fileName, mimeType);
    await refreshUser();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      {/* Hero card */}
      <Card style={styles.heroCard}>
        <AvatarPicker
          currentUrl={avatarUrl}
          name={fullName}
          size={72}
          onPick={handleAvatarPick}
        />
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{fullName}</Text>
          <Text style={styles.heroEmail}>{user.email}</Text>
        </View>
      </Card>

      {/* Sections */}
      {section === 'view' && (
        <ProfileActions
          onEditProfile={goTo('editProfile')}
          onChangePassword={goTo('changePassword')}
          onChangeEmail={goTo('changeEmail')}
          onLogout={logout}
          userId={user.id}
        />
      )}

      {section === 'editProfile' && (
        <EditProfileSection
          initialFirstName={user.first_name}
          initialLastName={user.last_name}
          onSuccess={async () => { await refreshUser(); setSection('view'); }}
          onCancel={goTo('view')}
        />
      )}

          {section === 'changePassword' && (
            <ChangePasswordSection
              onSuccess={() => setSection('view')}
              onCancel={goTo('view')}
              showAlert={showAlert}
            />
          )}

          {section === 'changeEmail' && (
            <RequestEmailChangeSection
              onSuccess={() => setSection('view')}
              onCancel={goTo('view')}
              showAlert={showAlert}
            />
          )}
    </ScrollView>
  );
}

interface ProfileActionsProps {
  onEditProfile: () => void;
  onChangePassword: () => void;
  onChangeEmail: () => void;
  onLogout: () => void;
  userId: string;
}

function ProfileActions({
  onEditProfile,
  onChangePassword,
  onChangeEmail,
  onLogout,
}: ProfileActionsProps) {
  const { t } = useLocalization();

  function confirmLogout() {
    Alert.alert(t('sign_out', 'Sign out'), t('confirm_sign_out', 'Are you sure?'), [
      { text: t('cancel', 'Cancel'), style: 'cancel' },
      { text: t('sign_out', 'Sign out'), style: 'destructive', onPress: onLogout },
    ]);
  }

  return (
    <View style={styles.actions}>
      <MenuItem icon="✏️" label={t('edit_profile','Edit profile')} onPress={onEditProfile} />
      <MenuItem icon="🔑" label={t('change_password','Change password')} onPress={onChangePassword} />
      <MenuItem icon="✉️" label={t('change_email','Change email')} onPress={onChangeEmail} />
      <MenuItem icon="🚪" label={t('sign_out','Sign out')} onPress={confirmLogout} destructive />
    </View>
  );
}

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuItem({ icon, label, onPress, destructive = false }: MenuItemProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.menuItem}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={[styles.menuLabel, destructive && { color: colors.error }]}>{label}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </Card>
    </TouchableOpacity>
  );
}

function EditProfileSection({
  initialFirstName,
  initialLastName,
  onSuccess,
  onCancel,
}: {
  initialFirstName: string;
  initialLastName: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocalization();

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      setError(t('both_fields_required','Both fields are required'));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await profileApi.updateProfile({ first_name: firstName.trim(), last_name: lastName.trim() });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('update_failed','Update failed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('edit_profile','Edit Profile')}</Text>
      <ErrorBanner message={error} />
      <TextInput label={t('first_name_label','First name')} value={firstName} onChangeText={setFirstName} />
      <TextInput label={t('last_name_label','Last name')} value={lastName} onChangeText={setLastName} />
      <Button label={t('save_changes','Save changes')} onPress={handleSave} loading={isLoading} />
      <Button label={t('cancel','Cancel')} onPress={onCancel} variant="ghost" />
    </Card>
  );
}

function ChangePasswordSection({
  onSuccess,
  onCancel,
  showAlert,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  showAlert: (message: string, options?: any) => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocalization();

  async function handleSave() {
    if (!current || !next || !confirm) { setError(t('all_fields_required','All fields are required')); return; }
    if (next.length < 8) { setError(t('password_min_length','New password must be at least 8 characters')); return; }
    if (next !== confirm) { setError(t('passwords_must_match','Passwords do not match')); return; }
    setIsLoading(true);
    setError(null);
      try {
      await profileApi.changePassword({ current_password: current, new_password: next });
      showAlert(t('password_updated','Password updated successfully.'), { type: 'success' });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('password_update_failed','Failed to update password'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('change_password','Change Password')}</Text>
      <ErrorBanner message={error} />
      <TextInput label="Current password" value={current} onChangeText={setCurrent} isPassword />
      <TextInput label="New password" value={next} onChangeText={setNext} isPassword hint="Min. 8 characters" />
      <TextInput label="Confirm new password" value={confirm} onChangeText={setConfirm} isPassword />
      <Button label={t('update_password','Update password')} onPress={handleSave} loading={isLoading} />
      <Button label={t('cancel','Cancel')} onPress={onCancel} variant="ghost" />
    </Card>
  );
}

function RequestEmailChangeSection({
  onSuccess,
  onCancel,
  showAlert,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  showAlert: (message: string, options?: any) => void;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocalization();

  async function handleRequest() {
    if (!/\S+@\S+\.\S+/.test(newEmail)) { setError(t('enter_valid_email','Enter a valid email address')); return; }
    setIsLoading(true);
    setError(null);
    try {
      await profileApi.requestEmailChange({ new_email: newEmail.trim().toLowerCase() });
      showAlert(t('check_inbox_msg', `We've sent a confirmation link to ${newEmail}.`), { type: 'success' });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to request email change');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('change_email','Change Email')}</Text>
      <ErrorBanner message={error} />
      <TextInput
        label="New email address"
        placeholder="new@example.com"
        value={newEmail}
        onChangeText={setNewEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button label={t('send_confirmation','Send confirmation')} onPress={handleRequest} loading={isLoading} />
      <Button label={t('cancel','Cancel')} onPress={onCancel} variant="ghost" />
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },

  heroCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  heroInfo: { flex: 1, gap: spacing.xs },
  heroName: { ...typography.h3 },
  heroEmail: { ...typography.bodySmall },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  actions: { gap: spacing.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuIcon: { fontSize: 20 },
  menuLabel: { ...typography.body, flex: 1 },
  menuArrow: { ...typography.h3, color: colors.textMuted },

  sectionCard: { gap: spacing.md },
  sectionTitle: { ...typography.h2 },
});
