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
  name:       string;
  species:    string;
  breed:      string;
  birth_date: string;
  gender:     string;
}

export function PetFormScreen({ existingPet, onSuccess, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const isEditing = !!existingPet;

  const [form, setForm] = useState<FormState>({
    name:       existingPet?.name ?? '',
    species:    existingPet?.species ?? '',
    breed:      existingPet?.breed ?? '',
    birth_date: existingPet?.birth_date
      ? new Date(existingPet.birth_date).toISOString().split('T')[0]
      : '',
    gender:     existingPet?.gender ?? '',
  });

  const [savedPet, setSavedPet] = useState<Pet | null>(existingPet ?? null);
  const [errors, setErrors]     = useState<Partial<FormState>>({});
  const [error, setError]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  function set(field: keyof FormState) {
    return (value: string) => {
      setForm(p => ({ ...p, [field]: value }));
      setErrors(p => ({ ...p, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = t('name_required','Il nome è obbligatorio');
    if (!form.species.trim()) e.species = t('species_required','La specie è obbligatoria');
    if (form.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date)) {
      e.birth_date = t('date_format','Formato: YYYY-MM-DD');
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
        name:       form.name.trim(),
        species:    form.species.trim().toLowerCase(),
        breed:      form.breed.trim() || undefined,
        birth_date: form.birth_date ? new Date(form.birth_date).toISOString() : null,
        gender:     form.gender || undefined,
      };

      const pet = isEditing
        ? await petsApi.update(existingPet!.id, dto)
        : await petsApi.create(dto);

      setSavedPet(pet);
      onSuccess(pet);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('something_went_wrong','Qualcosa è andato storto'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAvatarPick(uri: string, fileName: string, mimeType: string) {
    if (!savedPet) {
      Alert.alert(t('save_first','Salva prima'), t('save_first_msg', "Salva l'animale prima di caricare la foto."));
      return;
    }
      const updatedFile = await uploadApi.petAvatar(savedPet.id, uri, fileName, mimeType);
      setSavedPet(prev => {
        const next = prev ? { ...prev, avatar: updatedFile, avatar_url: updatedFile.url } : prev;
        return next;
      });

      try {
        const refreshed = await petsApi.get(savedPet.id);
        setSavedPet(refreshed);
      } catch (e) {
      }
  }
  
  const currentAvatarSource = savedPet?.avatar?.id ?? savedPet?.avatar_file_id ?? savedPet?.avatar_url ?? '';

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>{t('cancel','Annulla')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? t('edit','Modifica') : t('new_pet','Nuovo animale')}
          </Text>
          <View style={{ width: 70 }} />
        </View>

        {/* BODY */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ErrorBanner message={error} />

          {/* AVATAR PICKER */}
          <View style={styles.avatarRow}>
            <AvatarPicker
              currentUrl={currentAvatarSource}
              name={form.name || t('pet','Pet')}
              size={96}
              onPick={handleAvatarPick}
            />
            {!savedPet && (
              <Text style={styles.avatarHint}>
                Salva prima per poter caricare la foto
              </Text>
            )}
          </View>

          {/* NAME */}
          <TextInput
            label={t('name_label','Nome *')}
            value={form.name}
            onChangeText={set('name')}
            error={errors.name}
          />

          {/* SPECIES */}
          <Text style={styles.label}>{t('species_label','Specie *')}</Text>
          <View style={styles.row}>
            {SPECIES_OPTIONS.map(opt => {
              const selected = form.species === opt.value;
              const label = `${opt.emoji} ${t(`species.${opt.key}`, opt.key)}`;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => set('species')(opt.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* BREED */}
          <TextInput label="Razza" value={form.breed} onChangeText={set('breed')} />

          {/* GENDER */}
          <Text style={styles.label}>{t('gender_label','Sesso')}</Text>
          <View style={styles.row}>
            {GENDER_OPTIONS.map(opt => {
              const selected = form.gender === opt.value;
              const label = t(opt.labelKey, opt.labelKey.split('.').pop() || opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => set('gender')(opt.value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* BIRTH DATE */}
          <Text style={styles.label}>Data di nascita</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateInput, errors.birth_date && styles.inputError]}
          >
            <Text style={form.birth_date ? styles.dateText : styles.placeholderText}>
              {form.birth_date || t('date_placeholder','YYYY-MM-DD')}
            </Text>
          </TouchableOpacity>
          {errors.birth_date ? (
            <Text style={styles.errorText}>{errors.birth_date}</Text>
          ) : null}

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
            label={isEditing ? t('save','Salva') : t('create','Crea')}
            onPress={handleSubmit}
            loading={isLoading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.background },
  flex:       { flex: 1 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  cancelText: { color: colors.primary },
  headerTitle:{ ...typography.h3 },
  container:  { padding: spacing.lg, gap: spacing.md },
  avatarRow:  { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  avatarHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  label:      { ...typography.label, marginTop: spacing.sm },
  row:        { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip:       { padding: spacing.xs, borderWidth: 1, borderRadius: radius.md },
  chipSelected: { backgroundColor: colors.primaryLight },
  dateInput:  {
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
  }
});
