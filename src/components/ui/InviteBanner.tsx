import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FamilyInvite } from '../../types';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';

interface Props {
  invite: FamilyInvite;
  onAccept: (invite: FamilyInvite) => void;
  onDecline: (invite: FamilyInvite) => void;
}

export function InviteBanner({ invite, onAccept, onDecline }: Props) {
  const inviterName = invite.inviter
    ? `${invite.inviter.first_name} ${invite.inviter.last_name}`
    : 'Qualcuno';

  return (
    <View style={styles.container}>
      <View style={styles.accent} />
      <View style={styles.body}>
        <Text style={styles.icon}>🏠</Text>
        <View style={styles.text}>
          <Text style={styles.title}>Invito famiglia</Text>
          <Text style={styles.sub}>
            <Text style={styles.bold}>{inviterName}</Text> ti invita in{' '}
            <Text style={styles.bold}>{invite.family?.name ?? '…'}</Text>
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onDecline(invite)} style={[styles.btn, styles.btnDecline]}>
          <Text style={styles.btnDeclineText}>Rifiuta</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onAccept(invite)} style={[styles.btn, styles.btnAccept]}>
          <Text style={styles.btnAcceptText}>Accetta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryMid,
    overflow: 'hidden',
    ...shadow.sm,
  },
  accent: {
    height: 4,
    backgroundColor: colors.primary,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  icon: { fontSize: 28 },
  text: { flex: 1 },
  title: { ...typography.label, color: colors.primary },
  sub: { ...typography.body, marginTop: 2 },
  bold: { fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnDecline: { backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border },
  btnDeclineText: { ...typography.body, fontWeight: '600', color: colors.textSecondary },
  btnAccept: { backgroundColor: colors.primary },
  btnAcceptText: { ...typography.body, fontWeight: '700', color: colors.textOnPrimary },
});
