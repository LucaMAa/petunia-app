import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { ActivityType, Pet } from '../../../types';
import { colors, radius, spacing, typography } from '../../../styles/theme';
import { Avatar } from '../../../components/ui';

const options: { type: ActivityType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'walk', label: 'Passeggiata', icon: 'walk-outline' },
  { type: 'park', label: 'Giro al parco', icon: 'paw-outline' },
  { type: 'run', label: 'Corsa', icon: 'fitness-outline' },
  { type: 'hike', label: 'Escursione', icon: 'trail-sign-outline' },
];
export function ActivityStartSheet({
  visible,
  pet,
  pets,
  onClose,
  onStart,
}: {
  visible: boolean;
  pet?: Pet;
  pets?: Pet[];
  onClose: () => void;
  onStart: (type: ActivityType, pet?: Pet) => void;
}) {
  const [selectedPet, setSelectedPet] = React.useState<Pet | undefined>(pet ?? pets?.[0]);
  const [step, setStep] = React.useState<1 | 2>(1);
  React.useEffect(() => {
    if (!visible) return;
    setSelectedPet(pet ?? pets?.[0]);
    setStep(1);
  }, [visible, pet, pets]);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {step === 1 ? (
        <>
          <Text style={styles.eyebrow}>NUOVA ATTIVITÀ</Text>
          <Text style={styles.title}>Con chi vuoi uscire?</Text>
          <Text style={styles.copy}>Scegli l&apos;animale che ti accompagnerà.</Text>

          <View style={{ marginTop: spacing.sm }}>
            {!pets || pets.length === 0 ? (
              <View style={{ padding: spacing.md }}>
                <Text style={{ color: colors.textMuted }}>Non hai ancora animali.</Text>
                <TouchableOpacity onPress={onClose} style={{ marginTop: spacing.sm }}>
                  <Text style={{ color: colors.primary }}>Aggiungi un animale</Text>
                </TouchableOpacity>
              </View>
            ) : (
              pets.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedPet(p)}
                  style={[
                    styles.petRow,
                    p.id === selectedPet?.id && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.icon}>
                    <Ionicons name="paw-outline" color={colors.primary} size={18} />
                  </View>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}
                  >
                    <Avatar name={p.name} uri={p.avatar_file_id ?? undefined} size={40} />
                    <Text style={styles.optionText}>{p.name}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { marginTop: spacing.lg, opacity: selectedPet ? 1 : 0.5 }]}
            onPress={() => selectedPet && setStep(2)}
            disabled={!selectedPet}
          >
            <Text style={styles.submitBtnText}>Continua</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.headerRowStep}>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={{ color: colors.primary }}>← Indietro</Text>
            </TouchableOpacity>
            <Text style={styles.eyebrow}>2 di 2</Text>
          </View>
          <Text style={styles.title}>Dove andate oggi?</Text>
          <Text style={styles.copy}>
            Il percorso verrà salvato nel tuo diario con privacy privata.
          </Text>
          <View style={styles.privacy}>
            <Ionicons name="lock-closed" color={colors.primary} size={16} />
            <Text style={styles.privacyText}>
              Solo tu potrai vedere il percorso di {selectedPet?.name ?? 'questa attività'}.
            </Text>
          </View>
          <View style={styles.options}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={styles.option}
                onPress={() => onStart(option.type, selectedPet)}
              >
                <View style={styles.icon}>
                  <Ionicons name={option.icon} color={colors.primary} size={21} />
                </View>
                <Text style={styles.optionText}>{option.label}</Text>
                <Ionicons name="arrow-forward" color={colors.textMuted} size={18} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      <TouchableOpacity onPress={onClose} style={styles.cancel}>
        <Text style={styles.cancelText}>Annulla</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  eyebrow: { ...typography.overline },
  title: { ...typography.h2, marginTop: spacing.xs },
  copy: { ...typography.bodySmall, marginTop: spacing.xs },
  privacy: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
  },
  privacyText: { ...typography.bodySmall, flex: 1 },
  options: { marginTop: spacing.lg, gap: spacing.sm },
  option: {
    height: 58,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
  },
  optionText: { ...typography.bodyMedium, fontWeight: '700' },
  cancel: { height: 44, justifyContent: 'center', alignItems: 'center', marginTop: spacing.md },
  cancelText: { ...typography.label, color: colors.textSecondary },
  petRow: {
    height: 64,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  submitBtn: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  submitBtnText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 15 },
  headerRowStep: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
