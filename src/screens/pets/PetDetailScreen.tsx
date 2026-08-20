import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Family, Pet } from '../../types';
import { petsApi } from '../../api/pets';
import { uploadApi } from '../../api/uploads';
import { Avatar, Button, Card, ErrorBanner } from '../../components/ui';
import { FamilyPickerModal } from '../families/FamilyPickerModal';
import { colors, layout, radius, spacing, typography } from '../../styles/theme';
import { useLocalization } from '../../context/LocalizationContext';
interface Props {
  petId: string;
  onEdit: (pet: Pet) => void;
  onBack: () => void;
  onDelete: () => void;
  onOpenReminders: (family: Family) => void;
  onOpenDocuments: () => void;
}
export function PetDetailScreen({
  petId,
  onEdit,
  onBack,
  onDelete,
  onOpenReminders,
  onOpenDocuments,
}: Props) {
  const inset = useSafeAreaInsets();
  const [pet, setPet] = useState<Pet | null>(null);
  const [docs, setDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  const { t } = useLocalization();
  const [tab, setTab] = useState<'overview' | 'health' | 'activity'>('overview');
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const item = await petsApi.get(petId);
        setPet(item);
        try {
          setDocs((await uploadApi.listPetDocuments(petId)).length);
        } catch {}
      } finally {
        setLoading(false);
      }
    })();
  }, [petId]);
  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  if (!pet)
    return (
      <View style={s.center}>
        <ErrorBanner message={t('failed_to_load_pet')} />
        <Button label={t('back_to_pets')} onPress={onBack} fullWidth={false} />
      </View>
    );
  const askDelete = () =>
    Alert.alert(`${t('delete_pet')} ${pet.name}?`, `${t('delete_pet_confirmation')}`, [
      { text: `${t('cancel')}`, style: 'cancel' },
      {
        text: `${t('delete')}`,
        style: 'destructive',
        onPress: async () => {
          await petsApi.delete(petId);
          onDelete();
        },
      },
    ]);
  return (
    <ScrollView
      style={s.safe}
      contentContainerStyle={[
        s.content,
        { paddingBottom: inset.bottom + layout.tabBarHeight + spacing.xl },
      ]}
    >
      <View style={s.top}>
        <Pressable onPress={onBack} style={s.back}>
          <Ionicons name="chevron-back" color={colors.primary} size={18} />
          <Text style={s.backText}>{t('pets_caps')}</Text>
        </Pressable>
        <Button
          label={t('edit')}
          onPress={() => onEdit(pet)}
          variant="ghost"
          fullWidth={false}
          size="sm"
        />
      </View>
      <View style={s.hero}>
        <Avatar name={pet.name} uri={pet.avatar_file_id ?? undefined} size={96} />
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{pet.name}</Text>
          <Text style={s.meta}>{[pet.species, pet.breed].filter(Boolean).join(' · ')}</Text>
        </View>
      </View>
      <View style={s.tabs}>
        {(['overview', 'health', 'activity'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[s.tab, tab === key && s.tabActive]}
          >
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>
              {key === 'overview' ? t('overview') : key === 'health' ? t('health') : t('activity')}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === 'overview' ? (
        <>
          <Card variant="medical" style={s.panel}>
            <Text style={s.kicker}>{t('health_status')}</Text>
            <Text style={s.panelTitle}>{t('no_upcoming_due_dates')}</Text>
            <Text style={s.panelText}>
              {t('documents_and_reminders_help')} {pet.name}.
            </Text>
            <Button
              label={t('manage_reminders', '')}
              onPress={() => setPicker(true)}
              variant="secondary"
              fullWidth={false}
              size="sm"
            />
          </Card>
          <Row
            icon="document-text-outline"
            title={t('medical_documents')}
            value={docs ? `${docs} ${t('documents')}` : t('no_documents')}
            onPress={onOpenDocuments}
          />
          <Row
            icon="notifications-outline"
            title={t('reminders')}
            value={t('reminders_description')}
            onPress={() => setPicker(true)}
          />
        </>
      ) : tab === 'health' ? (
        <View style={s.empty}>
          <Text style={s.sectionTitle}>{t('health')}</Text>
          <Text style={s.emptyText}>{t('health_description')}</Text>
          <Button
            label={t('open_documents')}
            onPress={onOpenDocuments}
            variant="secondary"
            fullWidth={false}
          />
          <Button
            label={t('reminders')}
            onPress={() => setPicker(true)}
            variant="ghost"
            fullWidth={false}
          />
        </View>
      ) : (
        <View style={s.empty}>
          <Text style={s.sectionTitle}>{t('activity')}</Text>
          <Text style={s.emptyText}>{t('activity_description')}</Text>
        </View>
      )}
      <Pressable onPress={askDelete} style={s.delete}>
        <Ionicons name="trash-outline" color={colors.error} size={18} />
        <Text style={s.deleteText}>{t('delete_pet_profile')}</Text>
      </Pressable>
      <FamilyPickerModal
        visible={picker}
        petId={petId}
        onClose={() => setPicker(false)}
        onSelect={(family) => {
          setPicker(false);
          onOpenReminders(family);
        }}
      />
    </ScrollView>
  );
}
function Row({
  icon,
  title,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      <View style={s.icon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" color={colors.textMuted} size={18} />
    </Pressable>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.xl,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  center: {
    flex: 1,
    gap: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  backText: { ...typography.label, color: colors.primary },
  hero: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  name: { ...typography.display },
  meta: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  status: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xl,
  },
  tab: {
    minHeight: 44,
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { ...typography.label, color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  panel: { gap: spacing.sm, marginBottom: spacing.md },
  kicker: { ...typography.overline },
  panelTitle: { ...typography.h2 },
  panelText: { ...typography.bodySmall, marginBottom: spacing.sm },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    height: 36,
    width: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { ...typography.bodyMedium },
  rowValue: { ...typography.caption, marginTop: spacing.xxs },
  empty: { gap: spacing.md, paddingVertical: spacing.xl },
  sectionTitle: { ...typography.h3 },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  delete: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  deleteText: { ...typography.label, color: colors.error },
});
