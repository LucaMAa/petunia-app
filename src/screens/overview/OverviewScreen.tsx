import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { usePets } from "../../hooks/usePets";
import { colors, radius, spacing, typography } from "../../styles/theme";
import { Pet } from "../../types";
export function OverviewScreen({
  attentionCount,
  onOpenPets,
  onOpenAlerts,
  onOpenFamily,
}: {
  attentionCount: number;
  onOpenPets: () => void;
  onOpenAlerts: () => void;
  onOpenFamily: () => void;
}) {
  const { user } = useAuth();
  const { pets, isLoading, load } = usePets();
  useEffect(() => {
    load();
  }, [load]);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";
  
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.greeting}>
          {greeting}
          {user?.first_name ? `, ${user.first_name}` : ""}.
        </Text>
        <Text style={styles.heroCopy}>
          Ecco ciò che merita attenzione nella tua famiglia.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenAlerts}
        style={styles.focus}
      >
        <View style={styles.focusCopy}>
          <Text style={styles.eyebrow}>Alert e promemoria</Text>
          <Text style={styles.focusTitle}>
            {attentionCount
              ? `${attentionCount} attività richiedono attenzione`
              : "Tutto sotto controllo"}
          </Text>
          <Text style={styles.focusText}>
            {attentionCount
              ? "Apri gli alert per gestire le attività che richiedono un’azione."
              : "Non ci sono alert in sospeso."}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{attentionCount}</Text>
          <Text style={styles.metricLabel}>alert</Text>
        </View>
      </Pressable>
      <Header title="I tuoi animali" action="Gestisci" onAction={onOpenPets} />
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : pets.length ? (
        <View style={styles.rows}>
          {pets.slice(0, 4).map((pet) => (
            <PetRow key={pet.id} pet={pet} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="paw-outline" size={22} color={colors.primary} />
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>Nessun animale ancora</Text>
            <Text style={styles.emptyText}>
              Aggiungi il primo profilo per organizzare salute, documenti e
              promemoria.
            </Text>
          </View>
          <Button
            label="Aggiungi"
            onPress={onOpenPets}
            fullWidth={false}
            size="sm"
          />
        </View>
      )}
      <Header title="Spazio famiglia" action="Apri" onAction={onOpenFamily} />
      <Pressable onPress={onOpenFamily} style={styles.familyRow}>
        <View style={styles.iconBox}>
          <Ionicons name="people-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>La mia famiglia</Text>
          <Text style={styles.rowMeta}>Membri, ruoli e animali condivisi</Text>
        </View>
        <Ionicons name="chevron-forward" color={colors.textMuted} size={18} />
      </Pressable>
      <Header title="In primo piano" />
      <View style={styles.rows}>
        <Timeline
          icon="calendar-outline"
          title="Prossimi appuntamenti"
          text="Il backend attuale gestisce promemoria, non appuntamenti veterinari separati."
        />
        <Timeline
          icon="document-text-outline"
          title="Documenti sanitari"
          text="I documenti sono disponibili dal profilo di ciascun animale."
        />
        <Timeline
          icon="time-outline"
          title="Attività recente"
          text="Lo storico attività non è ancora fornito dal backend."
          last
        />
      </View>
    </ScrollView>
  );
}
function Header({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
function PetRow({ pet }: { pet: Pet }) {
  return (
    <View style={styles.row}>
      <Avatar
        name={pet.name}
        uri={pet.avatar_file_id ?? undefined}
        size={46}
      />
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{pet.name}</Text>
        <Text style={styles.rowMeta}>
          {[pet.species, pet.breed].filter(Boolean).join(" · ")}
        </Text>
      </View>
      <View style={styles.status}>
        <View style={styles.dot} />
        <Text style={styles.statusText}>In regola</Text>
      </View>
    </View>
  );
}
function Timeline({
  icon,
  title,
  text,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>{text}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
    maxWidth: 980,
    width: "100%",
    alignSelf: "center",
  },
  hero: { marginBottom: spacing.xxl },
  greeting: { ...typography.display },
  heroCopy: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  focus: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xxxl,
  },
  focusCopy: { flex: 1, paddingRight: spacing.lg },
  eyebrow: { ...typography.overline, marginBottom: spacing.xs },
  focusTitle: { ...typography.h2 },
  focusText: { ...typography.bodySmall, marginTop: spacing.sm },
  metric: {
    minWidth: 72,
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.lg,
  },
  metricValue: { fontSize: 32, fontWeight: "700", color: colors.primary },
  metricLabel: { ...typography.caption },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3 },
  action: { ...typography.label, color: colors.primary },
  loader: { paddingVertical: spacing.xxl },
  rows: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.xxxl,
  },
  row: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  familyRow: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xxxl,
  },
  rowCopy: { flex: 1 },
  rowTitle: { ...typography.bodyMedium },
  rowMeta: {
    ...typography.caption,
    marginTop: spacing.xxs,
    textTransform: "capitalize",
  },
  status: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  statusText: { ...typography.caption, color: colors.success },
  empty: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: "center",
    marginBottom: spacing.xxxl,
  },
  emptyCopy: { flex: 1 },
  emptyTitle: { ...typography.bodyMedium },
  emptyText: { ...typography.bodySmall, marginTop: spacing.xxs },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
