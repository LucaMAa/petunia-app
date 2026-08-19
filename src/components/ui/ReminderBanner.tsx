import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReminderFiredPayload, ReminderAckedPayload } from '../../types/reminders';
import { colors, spacing, radius, shadow, typography } from '../../styles/theme';

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  medicine: { emoji: '💊', label: 'Medicina' },
  food:     { emoji: '🍽', label: 'Cibo' },
  other:    { emoji: '🔔', label: 'Promemoria' },
};

interface FiredProps {
  payload: ReminderFiredPayload;
  onAck: (occurrenceKey: string) => void;
  onDismiss: () => void;
}

export function ReminderFiredBanner({ payload, onAck, onDismiss }: FiredProps) {
  const insets = useSafeAreaInsets();
  const meta = TYPE_META[payload.type] ?? TYPE_META.other;
  const translateY = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
    }).start();
  }, []);

  function handleAck() {
    onAck(payload.occurrence_key);
    onDismiss();
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top },
        { transform: [{ translateY }] },
      ]}
    >
      <View style={styles.accentBar} />
      <View style={styles.body}>
        <Text style={styles.emoji}>{meta.emoji}</Text>
        <View style={styles.textBlock}>
          <Text style={styles.label}>{meta.label.toUpperCase()}</Text>
          <Text style={styles.title}>{payload.title}</Text>
          {!!payload.pet_name && (
            <Text style={styles.sub}>Per {payload.pet_name}</Text>
          )}
          {!!payload.notes && (
            <Text style={styles.notes} numberOfLines={1}>{payload.notes}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} hitSlop={8}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onDismiss} style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryTxt}>Più tardi</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAck} style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryTxt}>✓ Fatto!</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

interface AckedProps {
  payload: ReminderAckedPayload;
  onDismiss: () => void;
}

export function ReminderAckedBanner({ payload, onDismiss }: AckedProps) {
  const insets = useSafeAreaInsets();
  const meta = TYPE_META[payload.type] ?? TYPE_META.other;
  const translateY = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        styles.ackedContainer,
        { paddingTop: insets.top },
        { transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.accentBar, styles.accentGreen]} />
      <View style={styles.body}>
        <Text style={styles.emoji}>{meta.emoji}</Text>
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: colors.success }]}>GIÀ FATTO</Text>
          <Text style={styles.title}>{payload.title}</Text>
          <Text style={styles.sub}>{payload.acked_by_name} ha già segnato come fatto</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} hitSlop={8}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.primaryMid,
    overflow: 'hidden',
    zIndex: 999,
    ...shadow.lg,
  },
  ackedContainer: {
    borderColor: colors.successLight,
  },
  accentBar: {
    height: 4,
    backgroundColor: colors.primary,
  },
  accentGreen: {
    backgroundColor: colors.success,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  emoji: { fontSize: 30, marginTop: 2 },
  textBlock: { flex: 1, gap: 2 },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  title: { ...typography.h4 },
  sub: { ...typography.caption, color: colors.textMuted },
  notes: { ...typography.caption, color: colors.textTertiary },
  closeBtn: {
    width: 26, height: 26, borderRadius: 99,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  btnSecondary: {
    flex: 1, height: 38, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  btnSecondaryTxt: { ...typography.body, fontWeight: '600', color: colors.textSecondary, fontSize: 14 },
  btnPrimary: {
    flex: 2, height: 38, borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.brand,
  },
  btnPrimaryTxt: { ...typography.body, fontWeight: '700', color: colors.textOnPrimary, fontSize: 14 },
});
