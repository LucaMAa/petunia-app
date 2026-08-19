import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, TextInput as RNTextInput, ActivityIndicator,
} from "react-native";
import { colors, spacing, radius, shadow } from "../../styles/theme";
import { CreateReportDto, MapReport, ReportType } from "../../types";
import { REPORT_TYPES, ReportTypeMeta } from "../../types/mapTypes";
import { useLocalization } from '../../context/LocalizationContext';

interface ProximityAlertProps {
  report: MapReport;
  onClose: () => void;
}

export function ProximityAlert({ report, onClose }: ProximityAlertProps) {
  const meta = REPORT_TYPES[report.type];
  return (
    <View style={alertSt.container}>
      <View style={[alertSt.bar, { backgroundColor: meta.color }]} />
      <View style={alertSt.body}>
        <Text style={alertSt.emoji}>{meta.emoji}</Text>
        <View style={alertSt.text}>
          <Text style={alertSt.title}>⚠ {meta.label.toUpperCase()}</Text>
          <Text style={alertSt.desc} numberOfLines={2}>{report.title}</Text>
          {!!report.distance_m && report.distance_m > 0 && (
            <Text style={alertSt.dist}>{`A circa ${Math.round(report.distance_m)} m da te`}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={8} style={alertSt.close}>
          <Text style={alertSt.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const alertSt = StyleSheet.create({
  container: {
    position: "absolute", top: 80, left: spacing.lg, right: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 2, borderColor: colors.error, overflow: "hidden",
    ...shadow.lg, zIndex: 200,
  },
  bar:       { height: 5 },
  body:      { flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.sm },
  emoji:     { fontSize: 32 },
  text:      { flex: 1 },
  title:     { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, color: colors.error },
  desc:      { fontSize: 15, fontWeight: "500", marginTop: 2, color: colors.text },
  dist:      { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  close:     { width: 28, height: 28, borderRadius: 99, backgroundColor: colors.errorLight, alignItems: "center", justifyContent: "center" },
  closeText: { color: colors.error, fontWeight: "700", fontSize: 13 },
});

interface ReportDetailSheetProps {
  report: MapReport;
  onClose: () => void;
  onAbuse: (reason?: string) => void;
  onDelete: () => void;
}

export function ReportDetailSheet({ report, onClose, onAbuse, onDelete }: ReportDetailSheetProps) {
  const meta = REPORT_TYPES[report.type];
  const author = report.user
    ? `${report.user.first_name} ${report.user.last_name}`
    : "Utente";
  const { formatDate } = useLocalization();

  function confirmAbuse() {
    Alert.alert("Segnala abuso", "Questa segnalazione è falsa o inappropriata?", [
      { text: "Annulla", style: "cancel" },
      { text: "Segnala", style: "destructive", onPress: () => onAbuse() },
    ]);
  }

  function confirmDelete() {
    Alert.alert("Elimina segnalazione?", "Azione irreversibile.", [
      { text: "Annulla", style: "cancel" },
      { text: "Elimina", style: "destructive", onPress: onDelete },
    ]);
  }

  return (
    <View style={sheetSt.container}>
      <View style={sheetSt.handle} />

      <View style={sheetSt.header}>
        <View style={[sheetSt.typeTag, { backgroundColor: meta.bg }]}>
          <Text style={sheetSt.typeEmoji}>{meta.emoji}</Text>
          <Text style={[sheetSt.typeLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={sheetSt.closeBtn}>
          <Text style={sheetSt.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={sheetSt.title}>{report.title}</Text>
      {!!report.description && <Text style={sheetSt.desc}>{report.description}</Text>}

      <View style={sheetSt.meta}>
        <Text style={sheetSt.metaText}>👤 {author}</Text>
        <Text style={sheetSt.metaText}>
          📅 {formatDate(report.created_at)}
        </Text>
        {!!report.distance_m && report.distance_m > 0 && (
          <Text style={sheetSt.metaText}>📏 {Math.round(report.distance_m)} m</Text>
        )}
        {report.abuse_count > 0 && (
          <Text style={[sheetSt.metaText, { color: colors.error }]}>
            🚩 {report.abuse_count} segnalazioni abuso
          </Text>
        )}
      </View>

      <View style={sheetSt.actions}>
        <TouchableOpacity onPress={confirmAbuse} style={sheetSt.abuseBtn}>
          <Text style={sheetSt.abuseBtnText}>🚩 Segnala abuso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete} style={sheetSt.deleteBtn}>
          <Text style={sheetSt.deleteBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sheetSt = StyleSheet.create({
  container: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm,
    ...shadow.lg, zIndex: 100,
  },
  handle:       { width: 40, height: 4, borderRadius: 99, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.xs },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeTag:      { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  typeEmoji:    { fontSize: 16 },
  typeLabel:    { fontSize: 12, fontWeight: "700" },
  closeBtn:     { width: 30, height: 30, borderRadius: 99, backgroundColor: colors.backgroundAlt, alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: colors.textMuted, fontWeight: "700" },
  title:        { fontSize: 18, fontWeight: "600", color: colors.text },
  desc:         { fontSize: 15, color: colors.textSecondary },
  meta:         { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metaText:     { fontSize: 11, color: colors.textMuted },
  actions:      { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  abuseBtn:     { flex: 1, height: 42, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.backgroundAlt },
  abuseBtnText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  deleteBtn:    { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.errorLight, alignItems: "center", justifyContent: "center" },
  deleteBtnText:{ fontSize: 18 },
});

interface CreateReportSheetProps {
  coord: { lat: number; lng: number };
  onClose: () => void;
  onCreate: (dto: CreateReportDto) => Promise<void>;
}

export function CreateReportSheet({ coord, onClose, onCreate }: CreateReportSheetProps) {
  const [type, setType] = useState<ReportType>("interesting");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) { setError("Il titolo è obbligatorio"); return; }
    setIsLoading(true);
    setError(null);
    try {
      await onCreate({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        lat: coord.lat,
        lng: coord.lng,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore durante la creazione");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={createSt.container}>
      <View style={createSt.handle} />

      <View style={createSt.headerRow}>
        <Text style={createSt.headerTitle}>Nuova segnalazione</Text>
        <TouchableOpacity onPress={onClose} style={createSt.closeBtn}>
          <Text style={createSt.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
      >
        <Text style={createSt.coordText}>
          📍 {coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}
        </Text>

        <Text style={createSt.label}>Tipo *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs, paddingBottom: 4 }}>
          {(Object.entries(REPORT_TYPES) as [ReportType, ReportTypeMeta][]).map(([t, meta]) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[
                createSt.typeChip,
                { backgroundColor: meta.bg, borderColor: meta.color },
                type === t && createSt.typeChipSelected,
              ]}
            >
              <Text style={createSt.typeChipEmoji}>{meta.emoji}</Text>
              <Text style={[createSt.typeChipLabel, { color: meta.color }]}>{meta.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={createSt.label}>Titolo *</Text>
        <RNTextInput
          style={[createSt.input, !!error && !title.trim() && createSt.inputError]}
          placeholder="Es. Boccone trovato al parco"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={(v) => { setTitle(v); setError(null); }}
        />

        <Text style={createSt.label}>Descrizione</Text>
        <RNTextInput
          style={[createSt.input, createSt.textarea]}
          placeholder="Dettagli aggiuntivi…"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {!!error && <Text style={createSt.errorText}>⚠ {error}</Text>}

        <TouchableOpacity
          style={[createSt.submitBtn, isLoading && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={colors.textOnPrimary} />
            : <Text style={createSt.submitBtnText}>Salva segnalazione</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createSt = StyleSheet.create({
  container: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, paddingBottom: spacing.md, maxHeight: "75%",
    ...shadow.lg, zIndex: 100,
  },
  handle:           { width: 40, height: 4, borderRadius: 99, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.sm },
  headerRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  headerTitle:      { fontSize: 18, fontWeight: "600", color: colors.text },
  closeBtn:         { width: 30, height: 30, borderRadius: 99, backgroundColor: colors.backgroundAlt, alignItems: "center", justifyContent: "center" },
  closeBtnText:     { color: colors.textMuted, fontWeight: "700" },
  coordText:        { fontSize: 11, color: colors.textMuted },
  label:            { fontSize: 11, fontWeight: "700", color: colors.textTertiary, letterSpacing: 1.4, textTransform: "uppercase", marginTop: spacing.xs },
  typeChip:         { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1.5 },
  typeChipSelected: { borderWidth: 2.5 },
  typeChipEmoji:    { fontSize: 14 },
  typeChipLabel:    { fontSize: 12, fontWeight: "700" },
  input:            { height: 46, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  textarea:         { height: 80, paddingTop: spacing.sm },
  inputError:       { borderColor: colors.error },
  errorText:        { fontSize: 11, color: colors.error },
  submitBtn:        { height: 50, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: spacing.sm, ...shadow.brand },
  submitBtnText:    { color: colors.textOnPrimary, fontWeight: "700", fontSize: 15 },
});
