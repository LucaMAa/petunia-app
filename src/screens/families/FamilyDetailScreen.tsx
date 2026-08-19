import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useAlert } from '../../components/ui/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Family, Pet } from '../../types';
import { familiesApi } from '../../api/families';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, radius } from '../../styles/theme';
import { UserSearchModal } from './UserSearchModal';
import { usePets } from '../../hooks/usePets';
import { PetCard } from '../../components/ui';

interface Props {
  familyId: string;
  onBack: () => void;
  onEdit: (family: Family) => void;
  onDelete: () => void;
  onOpenReminders: (familyId: string, familyName: string, pets: Pet[]) => void;
}

export function FamilyDetailScreen({ familyId, onBack, onEdit, onDelete, onOpenReminders }: Props) {
  const insets = useSafeAreaInsets();
  const { pets, load: loadPets } = usePets();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [family, setFamily] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [assigningPet, setAssigningPet] = useState(false);

  useEffect(() => { load(); }, [familyId]);
  useEffect(() => { loadPets(); }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setFamily(await familiesApi.get(familyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore nel caricamento');
    } finally {
      setIsLoading(false);
    }
  }

  const isOwner = family?.members?.some(
    m => m.user_id === user?.id && m.role === 'owner'
  );

  function confirmDelete() {
    Alert.alert(`Eliminare "${family?.name}"?`, 'Tutti i membri verranno rimossi.', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive',
        onPress: async () => { await familiesApi.delete(familyId); onDelete(); },
      },
    ]);
  }

  function confirmLeave() {
    Alert.alert('Lasciare la famiglia?', undefined, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Lascia', style: 'destructive',
        onPress: async () => { await familiesApi.leave(familyId); onDelete(); },
      },
    ]);
  }

  async function handleRemoveMember(userId: string, name: string) {
    Alert.alert(`Rimuovere ${name}?`, undefined, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Rimuovi', style: 'destructive',
        onPress: async () => { await familiesApi.removeMember(familyId, userId); await load(); },
      },
    ]);
  }

  async function handleAssignPet(petId: string) {
    try {
      await familiesApi.assignPet(familyId, petId);
      await load();
    } catch (e) {
      showAlert(e instanceof Error ? e.message : 'Assegnazione fallita', { type: 'error' });
    }
  }

  async function handleUnassignPet(petId: string) {
    Alert.alert('Rimuovere animale dalla famiglia?', undefined, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Rimuovi', style: 'destructive',
        onPress: async () => { await familiesApi.unassignPet(familyId, petId); await load(); },
      },
    ]);
  }

  if (isLoading) return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
    </View>
  );

  if (error || !family) return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.center}>
        <ErrorBanner message={error ?? 'Famiglia non trovata'} />
        <Button label="Indietro" onPress={onBack} variant="outline" style={{ marginTop: spacing.md, width: 160 }} />
      </View>
    </View>
  );

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* NAV */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={onBack} style={styles.navBtn}>
            <Text style={styles.navBack}>‹</Text>
            <Text style={styles.navLabel}>Indietro</Text>
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity onPress={() => onEdit(family)} style={styles.editBtn}>
              <Text style={styles.editText}>Modifica</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={{ fontSize: 48 }}>🏠</Text></View>
          <Text style={styles.heroName}>{family.name}</Text>
          <Text style={styles.heroSub}>{family.members?.length ?? 0} membri</Text>
        </View>

        {/* MEMBERS */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Membri</Text>
          {family.members?.map(member => {
            const name = member.user
              ? `${member.user.first_name} ${member.user.last_name}`
              : member.user_id;
            const isMe = member.user_id === user?.id;
            return (
              <View key={member.id} style={styles.memberRow}>
                <Avatar name={name} uri={member.user?.avatar_file_id ?? undefined} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{name}{isMe ? ' (tu)' : ''}</Text>
                  <Text style={styles.memberRole}>{member.role === 'owner' ? '👑 Proprietario' : 'Membro'}</Text>
                </View>
                {isOwner && !isMe && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member.user_id, name)}
                    style={styles.removeBtn}
                    hitSlop={8}
                  >
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </Card>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Animali della famiglia</Text>

          {family.pets && family.pets.length > 0
            ? family.pets.map(pet => (
              <PetCard
                key={pet.id}
                pet={pet}
                onPress={() => { }}
                onDelete={() => handleUnassignPet(pet.id)}
              />
            ))
            : <Text style={styles.hint}>Nessun animale assegnato</Text>
          }

          {/* Selettore per aggiungere un animale */}
          {isOwner && (
            <>
              <TouchableOpacity
                onPress={() => setAssigningPet(v => !v)}
                style={styles.addPetBtn}
              >
                <Text style={styles.addPetBtnText}>
                  {assigningPet ? '✕ Annulla' : '＋ Aggiungi animale'}
                </Text>
              </TouchableOpacity>

              {assigningPet && (
                <View style={{ gap: spacing.xs }}>
                  {pets
                    .filter(p => !family.pets?.some(fp => fp.id === p.id))
                    .map(pet => (
                      <TouchableOpacity
                        key={pet.id}
                        onPress={() => { handleAssignPet(pet.id); setAssigningPet(false); }}
                        style={styles.petOption}
                      >
                        <Text style={styles.petOptionText}>
                          {pet.name} · {pet.species}
                        </Text>
                      </TouchableOpacity>
                    ))
                  }
                </View>
              )}
            </>
          )}
        </Card> 

        <Button
          label="🔔 Promemoria famiglia"
          onPress={() => onOpenReminders(familyId, family.name, family.pets ?? [])}
          variant="secondary"
        />

        {isOwner && (
          <>
            <Button
              label="＋ Invita membro"
              onPress={() => setShowSearch(true)}
              variant="secondary"
            />
            <UserSearchModal
              visible={showSearch}
              familyId={familyId}
              onClose={() => setShowSearch(false)}
              onInvited={() => { setShowSearch(false); load(); }}
            />
          </>
        )}

        {/* ACTIONS */}
        <View style={styles.actions}>
          {isOwner
            ? <Button label="🗑 Elimina famiglia" onPress={confirmDelete} variant="danger" />
            : <Button label="🚪 Lascia famiglia" onPress={confirmLeave} variant="danger" />
          }
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },

  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.sm },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navBack: { fontSize: 22, color: colors.primary },
  navLabel: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  editBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primaryLight, borderRadius: radius.pill },
  editText: { color: colors.primaryDeep, fontWeight: '700' },

  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  heroIcon: { width: 90, height: 90, borderRadius: radius.xl, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  heroName: { ...typography.h1, textAlign: 'center' },
  heroSub: { ...typography.body, color: colors.textSecondary },

  card: { gap: spacing.sm },
  sectionTitle: { ...typography.h3 },
  hint: { ...typography.caption, color: colors.textMuted },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  memberName: { ...typography.bodyMedium },
  memberRole: { ...typography.caption, color: colors.textMuted },
  removeBtn: { width: 28, height: 28, borderRadius: radius.xs, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.error, fontSize: 13, fontWeight: '700' },

  inviteRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  inviteInput: { flex: 1, height: 44, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, justifyContent: 'center' },
  invitePlaceholder: { ...typography.body, color: colors.textMuted },
  inviteBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  inviteBtnText: { color: colors.textOnPrimary, fontWeight: '700' },

  actions: { marginTop: spacing.xs },


  addPetBtn: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  addPetBtnText: { color: colors.primaryDeep, fontWeight: '700' },
  petOption: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryMid,
    backgroundColor: colors.surface,
  },
  petOptionText: { ...typography.body },
});
