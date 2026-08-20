import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput as RNTextInput,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, shadow } from '../../../styles/theme';
import { CreateReportDto, ReportType } from '../../../types';
import { REPORT_TYPES, ReportTypeMeta } from '../../../types/mapTypes';
import { useLocalization } from '../../../context/LocalizationContext';

interface CreateReportSheetProps {
  coord: { lat: number; lng: number };
  onClose: () => void;
  onCreate: (dto: CreateReportDto) => Promise<void>;
}

export function CreateReportSheet({ coord, onClose, onCreate }: CreateReportSheetProps) {
  const { t } = useLocalization();
  const [type, setType] = useState<ReportType>('interesting');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setError('Il titolo è obbligatorio');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await onCreate({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        lat: coord.lat,
        lng: coord.lng,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('createReport.error'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={createSt.container}>
      <View style={createSt.handle} />

      <View style={createSt.headerRow}>
        <Text style={createSt.headerTitle}>{t('createReport.title')}</Text>
        <TouchableOpacity onPress={onClose} style={createSt.closeBtn}>
          <Text style={createSt.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
      >
        <Text style={createSt.coordText}>
          📍 {coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}
        </Text>

        <Text style={createSt.label}>{t('createReport.type')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs, paddingBottom: 4 }}
        >
          {(Object.entries(REPORT_TYPES) as [ReportType, ReportTypeMeta][]).map(([t, meta]) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[
                createSt.typeChip,
                { backgroundColor: meta.bg, borderColor: meta.color },
                type === t && createSt.typeChipSelected,
              ]}
            >
              <Text style={createSt.typeChipEmoji}>{meta.emoji}</Text>
              <Text style={[createSt.typeChipLabel, { color: meta.color }]}>{meta.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={createSt.label}>{t('createReport.title')}</Text>
        <RNTextInput
          style={[createSt.input, !!error && !title.trim() && createSt.inputError]}
          placeholder={t('createReport.titlePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={(v) => {
            setTitle(v);
            setError(null);
          }}
        />

        <Text style={createSt.label}>{t('createReport.description')}</Text>
        <RNTextInput
          style={[createSt.input, createSt.textarea]}
          placeholder={t('createReport.descriptionPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {!!error && <Text style={createSt.errorText}>⚠ {error}</Text>}

        <TouchableOpacity
          style={[createSt.submitBtn, isLoading && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={createSt.submitBtnText}>{t('createReport.submit')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createSt = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    ...shadow.lg,
    zIndex: 200,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 99,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: colors.textMuted, fontWeight: '700' },
  coordText: { fontSize: 11, color: colors.textMuted },
  mapPreview: {
    height: 220,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  typeChipSelected: { borderWidth: 2.5 },
  typeChipEmoji: { fontSize: 14 },
  typeChipLabel: { fontSize: 12, fontWeight: '700' },
  input: {
    height: 46,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textarea: { height: 80, paddingTop: spacing.sm },
  inputError: { borderColor: colors.error },
  errorText: { fontSize: 11, color: colors.error },
  submitBtn: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadow.brand,
  },
  submitBtnText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 15 },
});

export default CreateReportSheet;
