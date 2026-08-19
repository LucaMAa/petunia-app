import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "./Avatar";
import {
  colors,
  layout,
  radius,
  spacing,
  typography,
} from "../../styles/theme";

export type AppDestination =
  | "overview"
  | "pets"
  | "map"
  | "families"
  | "profile";
const items: {
  key: AppDestination;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "overview", label: "Home", icon: "home-outline" },
  { key: "pets", label: "Animali", icon: "paw-outline" },
  { key: "map", label: "Mappa", icon: "map-outline" },
  { key: "families", label: "Famiglia", icon: "people-outline" },
  { key: "profile", label: "Profilo", icon: "person-outline" },
];
interface Props {
  active: AppDestination;
  onNavigate: (destination: AppDestination) => void;
  notificationCount?: number;
  onNotifications?: () => void;
  onFamily?: () => void;
  children: React.ReactNode;
  userName?: string;
  userAvatar?: string;
}
export function AppShell({
  active,
  onNavigate,
  notificationCount,
  onNotifications,
  onFamily,
  children,
  userName,
  userAvatar,
}: Props) {
  const desktop = useWindowDimensions().width >= 900;
  const insets = useSafeAreaInsets();
  const title =
    active === "overview"
      ? "La tua giornata"
      : active === "pets"
        ? "I tuoi animali"
        : active === "families"
          ? "Spazio famiglia"
          : active === "map"
            ? "Mappa condivisa"
            : "Il mio profilo";
  return (
    <View style={[styles.app, !desktop && styles.appMobile]}>
      {desktop ? (
        <Sidebar
          active={active}
          onNavigate={onNavigate}
          userName={userName}
          userAvatar={userAvatar}
        />
      ) : null}
      <View style={[styles.main, !desktop && { paddingTop: insets.top }]}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.kicker}>
              {items.find((item) => item.key === active)?.label}
            </Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apri notifiche"
              onPress={onNotifications}
              style={styles.notice}
            >
              <Ionicons
                name="notifications-outline"
                color={colors.textSecondary}
                size={20}
              />
              {notificationCount ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
      {!desktop ? (
        <View
          style={[
            styles.mobileNav,
            { paddingBottom: Math.max(insets.bottom, spacing.sm) },
          ]}
        >
          {items.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={active === item.key}
              compact
              onPress={() => onNavigate(item.key)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
function Sidebar({
  active,
  onNavigate,
  userName,
  userAvatar,
}: Pick<Props, "active" | "onNavigate" | "userName" | "userAvatar">) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Ionicons name="paw" color={colors.textOnPrimary} size={18} />
        </View>
        <Text style={styles.brandText}>petunia</Text>
      </View>
      <View style={styles.sideNav}>
        {items.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={active === item.key}
            onPress={() => onNavigate(item.key)}
          />
        ))}
      </View>
      <Pressable onPress={() => onNavigate("profile")} style={styles.account}>
        <Avatar name={userName ?? ""} uri={userAvatar} size={36} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.accountName}>
            {userName ?? "Account"}
          </Text>
          <Text style={styles.accountRole}>Impostazioni</Text>
        </View>
        <Ionicons name="chevron-forward" color={colors.textMuted} size={16} />
      </Pressable>
    </View>
  );
}
function NavItem({
  item,
  active,
  compact,
  onPress,
}: {
  item: (typeof items)[number];
  active: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.navItem,
        compact && styles.compact,
        active && styles.navActive,
      ]}
    >
      <Ionicons
        name={item.icon}
        color={active ? colors.primary : colors.textMuted}
        size={compact ? 20 : 20}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.navLabel,
          compact && styles.compactLabel,
          active && styles.navLabelActive,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  app: { flex: 1, flexDirection: "row", backgroundColor: colors.background },
  appMobile: { flexDirection: "column" },
  sidebar: {
    width: 248,
    padding: spacing.xl,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.backgroundDeep,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  brandMark: {
    height: 34,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  brandText: { ...typography.h3 },
  sideNav: { gap: spacing.xs, flex: 1 },
  account: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  accountName: { ...typography.label, color: colors.text },
  accountRole: { ...typography.caption },
  main: { flex: 1, minWidth: 0 },
  topbar: {
    minHeight: layout.headerHeight,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  kicker: {
    ...typography.caption,
    color: colors.primary,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: { ...typography.h4, marginTop: spacing.xxs },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  family: {
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  familyText: { ...typography.caption, color: colors.textSecondary },
  notice: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  badge: {
    position: "absolute",
    right: 0,
    top: 0,
    minWidth: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 9, color: colors.textOnPrimary, fontWeight: "700" },
  content: { flex: 1 },
  mobileNav: {
    minHeight: layout.tabBarHeight,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.tabBar,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  navItem: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
  },
  compact: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
    flexDirection: "column",
    justifyContent: "center",
    gap: spacing.xxs,
  },
  navActive: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontWeight: "500",
  },
  navLabelActive: { color: colors.text, fontWeight: "600" },
  compactLabel: { fontSize: 9 },
});
