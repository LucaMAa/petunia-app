import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, shadow, radius } from '../styles/theme';

export interface TabItemProps {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
}

export function TabItem({ icon, label, active, onPress, badge }: TabItemProps) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
      {active && <View style={styles.tabPill} />}
      <View style={styles.tabIconWrapper}>
        <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
        {badge != null && badge > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface TabBarProps {
  children: React.ReactNode;
  paddingBottom: number;
}

export function TabBar({ children, paddingBottom }: TabBarProps) {
  return (
    <View style={[styles.tabBarOuter, { paddingBottom }]}>
      <View style={styles.tabBar}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    ...shadow.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.lg,
    gap: 2,
    position: 'relative',
    minHeight: 48,
  },
  tabPill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
  tabIconWrapper: { position: 'relative' },
  tabIcon: { fontSize: 20, opacity: 0.35 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '400' },
  tabLabelActive: { color: colors.primaryDeep, fontWeight: '700' },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 99,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
});
