import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Pet } from '../../types';
import { Avatar } from './Avatar';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';

interface PetCardProps {
  pet: Pet;
  onPress: () => void;
  onDelete?: () => void;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐈',
  bird: '🦜',
  rabbit: '🐇',
  fish: '🐟',
  hamster: '🐹',
  reptile: '🦎',
  other: '🐾',
};

const SPECIES_COLORS: Record<string, { bg: string; text: string }> = {
  dog: { bg: '#F5EAE2', text: '#7A3D22' },
  cat: { bg: '#EAF2EC', text: '#2E5E3A' },
  bird: { bg: '#E6F5F0', text: '#2B7A60' },
  rabbit: { bg: '#F0E6F5', text: '#5E2B7A' },
  fish: { bg: '#E6EBF5', text: '#2B3F7A' },
  hamster: { bg: '#F5F0E6', text: '#7A5C2B' },
  reptile: { bg: '#EBE6F5', text: '#432B7A' },
};

function getSpeciesColor(species: string) {
  return (
    SPECIES_COLORS[species.toLowerCase()] ?? { bg: colors.primaryLight, text: colors.primaryDeep }
  );
}

export function PetCard({ pet, onPress, onDelete }: PetCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const emoji = SPECIES_EMOJI[pet.species.toLowerCase()] ?? '🐾';
  const { bg, text } = getSpeciesColor(pet.species);

  function pressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }

  const avatarSource = pet.avatar_file_id ?? pet.avatar_url ?? undefined;

  return (
    <Animated.View style={[styles.wrapper, shadow.sm, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        style={styles.card}
      >
        <View style={[styles.accentBar, { backgroundColor: bg }]} />

        <View style={[styles.avatarBox]}>
          <Avatar uri={avatarSource} size={52} name={pet.name} />
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {pet.name}
          </Text>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: bg }]}>
              <Text style={[styles.tagText, { color: text }]}>
                {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
              </Text>
            </View>
            {pet.breed ? (
              <Text style={styles.breed} numberOfLines={1}>
                {pet.breed}
              </Text>
            ) : null}
          </View>
          {pet.gender ? <Text style={styles.meta}>{pet.gender}</Text> : null}
        </View>
        <View style={styles.trailing}>
          {onDelete ? (
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.chevron}>›</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  avatarBox: {
    margin: spacing.sm,
  },
  emoji: { fontSize: 30 },
  info: {
    flex: 1,
    gap: 4,
    paddingVertical: spacing.sm,
  },
  name: {
    ...typography.h4,
    letterSpacing: -0.2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  breed: {
    ...typography.caption,
    color: colors.textMuted,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  trailing: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '300',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.xs,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
});
