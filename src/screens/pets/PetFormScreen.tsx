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
import { useAlert } from '../../components/ui/AlertContext';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pet, CreatePetDto } from '../../types';
import { useLocalization } from '../../context/LocalizationContext';
import { petsApi } from '../../api/pets';
import { uploadApi } from '../../api/uploads';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { AvatarPicker } from '../../components/ui/AvatarPicker';

import { colors, spacing, typography, radius, layout } from '../../styles/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

const SPECIES_OPTIONS = [
  { emoji: '🐕', key: 'dog', value: 'dog' },
  { emoji: '🐈', key: 'cat', value: 'cat' },
  { emoji: '🦜', key: 'bird', value: 'bird' },
  { emoji: '🐇', key: 'rabbit', value: 'rabbit' },
  { emoji: '🐟', key: 'fish', value: 'fish' },
  { emoji: '🐹', key: 'hamster', value: 'hamster' },
  { emoji: '🦎', key: 'reptile', value: 'reptile' },
  { emoji: '🐾', key: 'other', value: 'other' },
];

const GENDER_OPTIONS = [
  { labelKey: 'gender.male', value: 'Male' },
  { labelKey: 'gender.female', value: 'Female' },
  { labelKey: 'gender.unknown', value: 'Unknown' },
];

interface Props {
  existingPet?: Pet;
  onSuccess: (pet: Pet) => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  gender: string;
}

export function PetFormScreen({ existingPet, onSuccess, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  useAlert();
  const isEditing = !!existingPet;

  const [form, setForm] = useState<FormState>({
    name: existingPet?.name ?? '',
    species: existingPet?.species ?? '',
    breed: existingPet?.breed ?? '',
    birth_date: existingPet?.birth_date
      ? new Date(existingPet.birth_date).toISOString().split('T')[0]
      : '',
    gender: existingPet?.gender ?? '',
  });

  const [savedPet, setSavedPet] = useState<Pet | null>(existingPet ?? null);
  const [pendingAvatar, setPendingAvatar] = useState<{
    uri: string;
    fileName: string;
    mimeType: string;
  } | null>(null);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  function set(field: keyof FormState) {
    return (value: string) => {
      setForm((p) => ({ ...p, [field]: value }));
      setErrors((p) => ({ ...p, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = t('name_required', 'Il nome è obbligatorio');
    if (!form.species.trim()) e.species = t('species_required', 'La specie è obbligatoria');
    if (form.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date)) {
      e.birth_date = t('date_format', 'Formato: YYYY-MM-DD');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsLoading(true);
    setError(null);
    try {
      const dto: CreatePetDto = {
        name: form.name.trim(),
        species: form.species.trim().toLowerCase(),
        breed: form.breed.trim() || undefined,
        birth_date: form.birth_date ? new Date(form.birth_date).toISOString() : null,
        gender: form.gender || undefined,
      };

      const pet = isEditing
        ? await petsApi.update(existingPet!.id, dto)
        : await petsApi.create(dto);

      setSavedPet(pet);
      if (pendingAvatar) {
        try {
          const updatedFile = await uploadApi.petAvatar(
            pet.id,
            pendingAvatar.uri,
            pendingAvatar.fileName,
            pendingAvatar.mimeType,
          );
          const match = (updatedFile.url || '').match(/\/api\/files\/([0-9a-f-]{36})/i);
          const returnedFileId = match ? match[1] : updatedFile.id;

          try {
            const refreshed = await petsApi.get(pet.id);
            setSavedPet(refreshed);
            onSuccess(refreshed);
          } catch (e) {
            // fallback: update locally
            setSavedPet((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                avatar: { ...updatedFile, id: returnedFileId, url: updatedFile.url },
                avatar_file_id: returnedFileId,
                avatar_url: updatedFile.url,
              };
            });
            onSuccess(pet);
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : t('upload_failed', 'Caricamento fallito'));
          onSuccess(pet);
        } finally {
          setPendingAvatar(null);
        }
      } else {
        onSuccess(pet);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('something_went_wrong', 'Qualcosa è andato storto'),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAvatarPick(uri: string, fileName: string, mimeType: string) {
    if (savedPet) {
      const updatedFile = await uploadApi.petAvatar(savedPet.id, uri, fileName, mimeType);
      const match = (updatedFile.url || '').match(/\/api\/files\/([0-9a-f-]{36})/i);
      const returnedFileId = match ? match[1] : updatedFile.id;
      setSavedPet((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          avatar: {
            ...updatedFile,
            id: returnedFileId,
            url: updatedFile.url,
          },
          avatar_file_id: returnedFileId,
          avatar_url: updatedFile.url,
        };
        return next;
      });

      try {
        const refreshed = await petsApi.get(savedPet.id);
        setSavedPet(refreshed);
      } catch (e) {}
    } else {
      setPendingAvatar({ uri, fileName, mimeType });
    }
  }

  const currentAvatarSource =
    pendingAvatar?.uri ??
    savedPet?.avatar?.id ??
    savedPet?.avatar_file_id ??
    savedPet?.avatar_url ??
    '';

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>{t('cancel', 'Annulla')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? t('edit', 'Modifica') : t('new_pet', 'Nuovo animale')}
          </Text>
          <View style={{ width: 70 }} />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ErrorBanner message={error} />
          <View style={styles.avatarRow}>
            <AvatarPicker
              currentUrl={currentAvatarSource}
              name={form.name}
              size={96}
              onPick={handleAvatarPick}
            />
            {pendingAvatar ? (
              <Text style={styles.avatarHint}>
                Anteprima immagine — verrà caricata al salvataggio
              </Text>
            ) : null}
          </View>
          <TextInput
            label={t('name_label', 'Nome *')}
            value={form.name}
            onChangeText={set('name')}
            error={errors.name}
          />
          <Text style={styles.label}>{t('species_label', 'Specie *')}</Text>
          <View style={styles.row}>
            {SPECIES_OPTIONS.map((opt) => {
              const selected = form.species === opt.value;
              const label = `${opt.emoji} ${t(`species.${opt.key}`, opt.key)}`;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => set('species')(opt.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput label="Razza" value={form.breed} onChangeText={set('breed')} />
          <Text style={styles.label}>{t('gender_label', 'Sesso')}</Text>
          <View style={styles.row}>
            {GENDER_OPTIONS.map((opt) => {
              const selected = form.gender === opt.value;
              const label = t(opt.labelKey, opt.labelKey.split('.').pop() || opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => set('gender')(opt.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.label}>Data di nascita</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateInput, errors.birth_date && styles.inputError]}
          >
            <Text style={form.birth_date ? styles.dateText : styles.placeholderText}>
              {form.birth_date || t('date_placeholder', 'YYYY-MM-DD')}
            </Text>
          </TouchableOpacity>
          {errors.birth_date ? <Text style={styles.errorText}>{errors.birth_date}</Text> : null}

          {showDatePicker && (
            <DateTimePicker
              value={form.birth_date ? new Date(form.birth_date) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  const iso = selectedDate.toISOString().split('T')[0];
                  set('birth_date')(iso);
                }
              }}
            />
          )}

          <Button
            label={isEditing ? t('save', 'Salva') : t('create', 'Crea')}
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
  avatarRow: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  avatarHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  label: { ...typography.label, marginTop: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  chipSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { ...typography.bodySmall, color: colors.text },
  chipTextSelected: { color: colors.primaryDeep, fontWeight: '700' },
  dateInput: {
    height: layout.inputHeight,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  dateText: {
    ...typography.body,
    color: colors.text,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textMuted,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
