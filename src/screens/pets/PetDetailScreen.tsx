import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Family, Pet } from '../../types';
import { petsApi } from '../../api/pets';
import { uploadApi } from '../../api/uploads';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';

import { colors, spacing, typography, radius, shadow } from '../../styles/theme';
import { useLocalization } from '../../context/LocalizationContext';
import { FamilyPickerModal } from '../families/FamilyPickerModal';

interface Props {
  petId: string;
  onEdit: (pet: Pet) => void;
  onBack: () => void;
  onDelete: () => void;
  onOpenReminders: (family: Family) => void;
  onOpenDocuments: () => void;
}



function calculateAge(d: string | null): string {
  if (!d) return '';
  const birth = new Date(d);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  if (months < 1) return 'meno di un mese';
  if (months < 12) return `${months} mesi`;
  const y = Math.floor(months / 12);
  return `${y} anni`;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐈',
  bird: '🦜',
  rabbit: '🐇',
  fish: '🐟',
  hamster: '🐹',
  reptile: '🦎',
};

export function PetDetailScreen({ petId, onEdit, onBack, onDelete, onOpenReminders, onOpenDocuments }: Props) {
  const insets = useSafeAreaInsets();
  const { t, formatDate } = useLocalization();

  const [pet, setPet] = useState<Pet | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);

  useEffect(() => {
    load();
  }, [petId]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const p = await petsApi.get(petId);
      setPet(p);
      try {
        const remoteDocs = await uploadApi.listPetDocuments(petId);
        setDocs(remoteDocs || []);
      } catch (e) {
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore nel caricamento');
    } finally {
      setIsLoading(false);
    }
  }

  function confirmDelete() {
    if (!pet) return;
    Alert.alert(
      t('confirm_delete_title','Elimina %s?').replace('%s', pet.name),
      t('confirm_delete_msg','Questa azione non può essere annullata.'),
      [
        { text: t('cancel','Annulla'), style: 'cancel' },
        {
          text: t('delete','Elimina'),
          style: 'destructive',
          onPress: async () => {
            await petsApi.delete(petId);
            onDelete();
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !pet) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <ErrorBanner message={error ?? 'Animale non trovato'} />
          <Button
            label="Indietro"
            onPress={onBack}
            variant="outline"
            style={{ marginTop: spacing.md, width: 160 }}
          />
        </View>
      </View>
    );
  }

  const age = calculateAge(pet.birth_date);
  const emoji = SPECIES_EMOJI[pet.species.toLowerCase()] ?? '🐾';

  const avatarSource = pet.avatar?.id ?? pet.avatar_file_id ?? pet.avatar_url ?? undefined;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* NAV */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={onBack} style={styles.navBtn}>
            <Text style={styles.navBack}>‹</Text>
            <Text style={styles.navLabel}>{t('back','Indietro')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onEdit(pet)} style={styles.editBtn}>
            <Text style={styles.editText}>{t('edit','Modifica')}</Text>
          </TouchableOpacity>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.avatarBox}>
            {avatarSource ? (
              <Avatar uri={avatarSource} size={96} name={pet.name} />
            ) : (
              <Text style={styles.emoji}>{emoji}</Text>
            )}
          </View>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.sub}>
            {pet.species} {pet.breed ? `• ${pet.breed}` : ''}
          </Text>
          {age ? <Text style={styles.age}>🎂 {age}</Text> : null}
        </View>

        {/* DETAILS */}
        <Card style={styles.card}>
          <Text style={styles.title}>{t('details','Dettagli')}</Text>
          <DetailItem icon="🐾" label={t('species_label','Specie')} value={pet.species} />
          <DetailItem icon="🏷" label={t('breed_label','Razza')} value={pet.breed || '—'} />
          <DetailItem icon="⚥" label={t('gender_label','Sesso')} value={pet.gender || '—'} />
          <DetailItem icon="📅" label={t('birthdate_label','Nascita')} value={formatDate(pet.birth_date ?? undefined)} />
        </Card>

        <Button
          label="🔔 Promemoria"
          onPress={() => setShowFamilyPicker(true)}
          variant="secondary"
          style={{ marginBottom: spacing.sm }}
        />
        <FamilyPickerModal
          visible={showFamilyPicker}
          petId={petId}
          onClose={() => setShowFamilyPicker(false)}
          onSelect={(family) => {
            setShowFamilyPicker(false);
            onOpenReminders(family);
          }}
        />
        <Card style={{ padding: 16, alignItems: 'stretch' }}>
          <Text style={{ ...typography.h3, marginBottom: spacing.xs }}>{t('documents','Documenti')}</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm }}>{t('documents_summary','Visualizza, aggiungi e gestisci i documenti del tuo animale')}</Text>
          <Button label={t('open_documents','Apri documenti')} onPress={() => onOpenDocuments()} />
        </Card>

        <View style={styles.danger}>
          <Button label="🗑 Elimina animale" onPress={confirmDelete} variant="danger" />
        </View>
      </ScrollView>
    </View>
  );
}

function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={di.row}>
      <Text style={di.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={di.label}>{label}</Text>
        <Text style={di.value}>{value}</Text>
      </View>
    </View>
  );
}

const di = StyleSheet.create({
  row:   { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  icon:  { fontSize: 16 },
  label: { ...typography.caption, color: colors.textMuted },
  value: { ...typography.bodyMedium },
});

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },

  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.sm },
  navBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navBack:  { fontSize: 22, color: colors.primary },
  navLabel: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  editBtn:  { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primaryLight, borderRadius: radius.pill },
  editText: { color: colors.primaryDeep, fontWeight: '700' },

  hero:      { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  avatarBox: { width: 100, height: 100, borderRadius: radius.xxl, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  emoji:     { fontSize: 52 },
  name:      { ...typography.h1, textAlign: 'center' },
  sub:       { ...typography.body, color: colors.textSecondary, textTransform: 'capitalize' },
  age:       { ...typography.bodySmall, color: colors.textMuted },

  card:   { gap: spacing.xs },
  title:  { ...typography.h3 },
  danger: { marginTop: spacing.sm },
});
