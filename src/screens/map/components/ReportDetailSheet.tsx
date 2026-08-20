import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, radius, shadow, layout } from '../../../styles/theme';
import { MapReport } from '../../../types';
import { REPORT_TYPES } from '../../../types/mapTypes';
import { useLocalization } from '../../../context/LocalizationContext';

interface ReportDetailSheetProps {
  report: MapReport;
  onClose: () => void;
  onAbuse: (reason?: string) => void;
  onDelete: () => void;
}

export function ReportDetailSheet({ report, onClose, onAbuse, onDelete }: ReportDetailSheetProps) {
  const meta = REPORT_TYPES[report.type];
  const author = report.user ? `${report.user.first_name} ${report.user.last_name}` : 'Utente';
  const { t, formatDate } = useLocalization();

  function confirmAbuse() {
    Alert.alert(t('report_abuse'), t('report_abuse_description'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('report'), style: 'destructive', onPress: () => onAbuse() },
    ]);
  }

  function confirmDelete() {
    Alert.alert(t('delete_report'), t('delete_report_description'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: onDelete },
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
        <Text style={sheetSt.metaText}>📅 {formatDate(report.created_at)}</Text>
        {!!report.distance_m && report.distance_m > 0 && (
          <Text style={sheetSt.metaText}>📏 {Math.round(report.distance_m)} m</Text>
        )}
        {report.abuse_count > 0 && (
          <Text style={[sheetSt.metaText, { color: colors.error }]}>
            🚩 {report.abuse_count} {t('abuse_reports')}
          </Text>
        )}
      </View>

      <View style={sheetSt.actions}>
        <TouchableOpacity onPress={confirmAbuse} style={sheetSt.abuseBtn}>
          <Text style={sheetSt.abuseBtnText}>🚩 {t('report_abuse')}</Text>
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
    position: 'absolute',
    bottom: layout.tabBarHeight,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    ...shadow.lg,
    zIndex: 100,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  typeEmoji: { fontSize: 16 },
  typeLabel: { fontSize: 12, fontWeight: '700' },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 99,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: colors.textMuted, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  desc: { fontSize: 15, color: colors.textSecondary },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metaText: { fontSize: 11, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  abuseBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
  },
  abuseBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 18 },
});

export default ReportDetailSheet;
