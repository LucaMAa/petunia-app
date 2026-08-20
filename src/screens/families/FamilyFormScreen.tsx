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
import { Family } from '../../types';
import { familiesApi } from '../../api/families';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { colors, spacing, typography } from '../../styles/theme';

interface Props {
  existingFamily?: Family;
  onSuccess: (family: Family) => void;
  onCancel: () => void;
}

export function FamilyFormScreen({ existingFamily, onSuccess, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const isEditing = !!existingFamily;

  const [name, setName] = useState(existingFamily?.name ?? '');
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      setNameError('Il nome è obbligatorio');
      return;
    }
    setNameError('');
    setIsLoading(true);
    setError(null);
    try {
      const family = isEditing
        ? await familiesApi.update(existingFamily!.id, { name: name.trim() })
        : await familiesApi.create({ name: name.trim() });
      onSuccess(family);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Qualcosa è andato storto');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>Annulla</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Modifica famiglia' : 'Nuova famiglia'}
          </Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ErrorBanner message={error} />

          <TextInput
            label="Nome famiglia *"
            placeholder="Es. Famiglia Rossi"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setNameError('');
            }}
            error={nameError}
            autoFocus
          />

          <Button
            label={isEditing ? 'Salva' : 'Crea famiglia'}
            onPress={handleSubmit}
            loading={isLoading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cancelText: { color: colors.primary },
  headerTitle: { ...typography.h3 },
  container: { padding: spacing.lg, gap: spacing.md },
});
