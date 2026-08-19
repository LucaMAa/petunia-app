import React, { useState, useCallback } from 'react';
import {
  View, Text, Modal, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { User } from '../../types';
import { familiesApi } from '../../api/families';
import { TextInput } from '../../components/ui/TextInput';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';

interface Props {
  visible: boolean;
  familyId: string;
  onClose: () => void;
  onInvited: () => void;
}

export function UserSearchModal({ visible, familyId, onClose, onInvited }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [searchError, setSearchError] = useState('');

  const search = useCallback(async (q: string) => {
    setQuery(q);
    setSearchError('');
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const users = await familiesApi.searchUsers(q.trim());
      setResults(users ?? []);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Errore nella ricerca');
    } finally {
      setIsSearching(false);
    }
  }, []);

  async function handleInvite(user: User) {
    setInviting(user.id);
    try {
      await familiesApi.invite(familyId, { user_id: user.id });
      onInvited();
      setResults(prev => prev.filter(u => u.id !== user.id));
    } catch (e) {
      setResults(prev => prev.filter(u => u.id !== user.id));
    } finally {
      setInviting(null);
    }
  }

  function handleClose() {
    setQuery('');
    setResults([]);
    setSearchError('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Invita membro</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Cerca per nome o cognome…"
            value={query}
            onChangeText={search}
            autoFocus
            leftElement={<Text style={{ fontSize: 16 }}>🔍</Text>}
            error={searchError}
          />
          {query.length > 0 && query.length < 2 && (
            <Text style={styles.hint}>Inserisci almeno 2 caratteri</Text>
          )}
        </View>

        {/* Results */}
        {isSearching ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={u => u.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              query.length >= 2 && !isSearching ? (
                <View style={styles.center}>
                  <Text style={styles.emptyText}>Nessun utente trovato</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={styles.resultRow}>
                <Avatar
                  name={`${item.first_name} ${item.last_name}`}
                  size={44}
                />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text style={styles.resultEmail}>{item.email}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleInvite(item)}
                  style={styles.inviteBtn}
                  disabled={inviting === item.id}
                >
                  {inviting === item.id
                    ? <ActivityIndicator size="small" color={colors.textOnPrimary} />
                    : <Text style={styles.inviteBtnText}>Aggiungi</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title:    { ...typography.h2 },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: colors.primaryDeep, fontWeight: '700' },

  searchBox: { padding: spacing.lg, paddingBottom: spacing.sm },
  hint:      { ...typography.caption, color: colors.textMuted, marginTop: 4 },

  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing.xl },
  emptyText: { ...typography.body, color: colors.textMuted },

  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.xs,
  },
  resultInfo:  { flex: 1 },
  resultName:  { ...typography.bodyMedium },
  resultEmail: { ...typography.caption, color: colors.textMuted },

  inviteBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    minWidth: 72,
    alignItems: 'center',
  },
  inviteBtnText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 13 },
});
