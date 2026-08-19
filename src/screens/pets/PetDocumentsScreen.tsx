import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { getAuthenticatedFileUrl } from "../../api/client";
import { uploadApi } from "../../api/uploads";
import { Button, Card, ErrorBanner } from "../../components/ui";
import { useAlert } from "../../components/ui/AlertContext";
import { useLocalization } from "../../context/LocalizationContext";
import {
  colors,
  layout,
  radius,
  spacing,
  typography,
} from "../../styles/theme";

type DocumentRecord = {
  id: string;
  url?: string;
  original_name?: string;
  mime_type?: string;
  size?: number;
  created_at?: string;
};

export function PetDocumentsScreen({
  petId,
  onBack,
}: {
  petId: string;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { t, formatDate } = useLocalization();
  const { showAlert } = useAlert();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const successAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!success) return;

    successAnimation.setValue(0);
    Animated.timing(successAnimation, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      Animated.timing(successAnimation, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setSuccess(null);
      });
    }, 3200);

    return () => clearTimeout(timeout);
  }, [success, successAnimation]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setDocs(
        ((await uploadApi.listPetDocuments(petId)) ?? []) as DocumentRecord[],
      );
    } catch {
      setError(
        t(
          "load_docs_failed",
          "Non siamo riusciti a caricare i documenti. I tuoi dati non sono stati modificati.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [petId]);

  const fileUrl = async (doc: DocumentRecord) =>
    doc.url ?? (await getAuthenticatedFileUrl(doc.id));
  const handleOpen = async (doc: DocumentRecord) => {
    try {
      const url = await fileUrl(doc);
      if (doc.mime_type?.startsWith("image/")) setPreview(url);
      else await Linking.openURL(url);
    } catch {
      showAlert(
        t("open_failed", "Impossibile aprire il file. Riprova più tardi."),
        { type: "error" },
      );
    }
  };
  const handleDelete = (doc: DocumentRecord) =>
    Alert.alert(
      t("delete", "Elimina documento"),
      t(
        "delete_document_message",
        "Il documento verrà eliminato definitivamente.",
      ),
      [
        { text: t("cancel", "Annulla"), style: "cancel" },
        {
          text: t("delete", "Elimina"),
          style: "destructive",
          onPress: async () => {
            try {
              await uploadApi.deleteFile(doc.id);
              setDocs((current) =>
                current.filter((item) => item.id !== doc.id),
              );
            } catch {
                showAlert(
                  t(
                    "delete_failed",
                    "Impossibile eliminare il file. Riprova più tardi.",
                  ),
                  { type: "error" },
                );
            }
          },
        },
      ],
    );
  const upload = async () => {
    setUploading(true);
    setSuccess(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const doc = await uploadApi.petDocument(
        petId,
        asset.uri,
        asset.name ?? `documento_${Date.now()}`,
        asset.mimeType ?? "application/octet-stream",
      );
      setDocs((current) => [doc as DocumentRecord, ...current]);
      setSuccess(
        t(
          "upload_success",
          "Il documento è ora disponibile nel profilo dell’animale.",
        ),
      );
    } catch (cause) {
      showAlert(
        cause instanceof Error
          ? cause.message
          : t(
              "upload_failed",
              "Impossibile caricare il documento. Riprova più tardi.",
            ),
        { type: "error" },
      );
    } finally {
      setUploading(false);
    }
  };

  const renderDocument = ({ item }: { item: DocumentRecord }) => {
    const isImage = item.mime_type?.startsWith("image/");
    const type = isImage
      ? "IMMAGINE"
      : item.mime_type?.includes("pdf")
        ? "PDF"
        : "FILE";
    return (
      <Card style={styles.document} padding="md">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Apri ${item.original_name ?? "documento"}`}
          onPress={() => handleOpen(item)}
          style={styles.documentMain}
        >
          {isImage && item.url ? (
            <Image source={{ uri: item.url }} style={styles.thumbnail} />
          ) : (
            <View style={styles.fileMark}>
              <Text style={styles.fileMarkText}>{type}</Text>
            </View>
          )}
          <View style={styles.documentCopy}>
            <Text numberOfLines={1} style={styles.documentName}>
              {item.original_name ?? t("document", "Documento")}
            </Text>
            <Text style={styles.documentMeta}>
              {[
                item.created_at ? formatDate(item.created_at) : null,
                item.size
                  ? `${Math.max(1, Math.round(item.size / 1024))} KB`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || type}
            </Text>
          </View>
        </Pressable>
        <View style={styles.actions}>
          <Button
            label={t("open", "Apri")}
            onPress={() => handleOpen(item)}
            variant="ghost"
            fullWidth={false}
            size="sm"
          />
          <Button
            label={t("delete", "Elimina")}
            onPress={() => handleDelete(item)}
            variant="ghost"
            fullWidth={false}
            size="sm"
            textStyle={styles.deleteText}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button
          label={t("back", "Indietro")}
          onPress={onBack}
          variant="ghost"
          fullWidth={false}
          size="sm"
        />
        <Text style={styles.headerTitle}>{t("documents", "Documenti")}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList
        data={docs}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        refreshing={loading && docs.length > 0}
        onRefresh={load}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + layout.tabBarHeight + spacing.xl },
        ]}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={styles.overline}>Archivio sanitario</Text>
            <Text style={styles.title}>
              {t("documents_title", "Documenti e certificati")}
            </Text>
            <Text style={styles.lead}>
              {t(
                "documents_lead",
                "Conserva referti, certificati e documenti importanti in un unico posto sicuro.",
              )}
            </Text>
            <Button
              label={
                uploading
                  ? t("uploading", "Caricamento…")
                  : t("add_document", "Aggiungi documento")
              }
              onPress={upload}
              loading={uploading}
              disabled={uploading}
              fullWidth={false}
              withShadow={false}
              style={styles.uploadButton}
            />
            {success ? (
              <Animated.View
                accessibilityLiveRegion="polite"
                style={[
                  styles.successBanner,
                  {
                    opacity: successAnimation,
                    transform: [
                      {
                        translateY: successAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-6, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.successAccent} />
                <Text style={styles.successText}>{success}</Text>
              </Animated.View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <DocumentsSkeleton />
          ) : error ? (
            <View style={styles.feedback}>
              <ErrorBanner message={error} />
              <Button
                label={t("retry", "Riprova")}
                onPress={load}
                variant="outline"
                fullWidth={false}
              />
            </View>
          ) : (
            <EmptyDocuments />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
      <Modal
        visible={Boolean(preview)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.previewOverlay}>
          <Image
            source={{ uri: preview ?? "" }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <Button
            label={t("close", "Chiudi")}
            onPress={() => setPreview(null)}
            variant="secondary"
            fullWidth={false}
          />
        </View>
      </Modal>
    </View>
  );
}

function EmptyDocuments() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Nessun documento salvato</Text>
      <Text style={styles.emptyText}>
        Aggiungi certificati, referti o prescrizioni per averli sempre a portata
        di mano.
      </Text>
    </View>
  );
}
function DocumentsSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.skeleton} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    height: layout.headerHeight,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h4 },
  headerSpacer: { width: 72 },
  content: { padding: spacing.xl, flexGrow: 1 },
  intro: { marginBottom: spacing.xl },
  overline: { ...typography.overline, marginBottom: spacing.xs },
  title: { ...typography.h1, marginBottom: spacing.sm },
  lead: { ...typography.body, color: colors.textSecondary, maxWidth: 480 },
  uploadButton: { alignSelf: "flex-start", marginTop: spacing.lg },
  successBanner: {
    flexDirection: "row",
    overflow: "hidden",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.md,
    backgroundColor: colors.successLight,
  },
  successAccent: { width: 3, backgroundColor: colors.success },
  successText: {
    ...typography.bodySmall,
    flex: 1,
    padding: spacing.md,
    color: colors.success,
  },
  document: { gap: spacing.md },
  documentMain: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  fileMark: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.infoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  fileMarkText: { ...typography.label, fontSize: 10, color: colors.info },
  documentCopy: { flex: 1, minWidth: 0 },
  documentName: { ...typography.bodyMedium },
  documentMeta: { ...typography.caption, marginTop: spacing.xxs },
  actions: { flexDirection: "row", alignSelf: "flex-end", gap: spacing.sm },
  deleteText: { color: colors.error },
  feedback: { alignItems: "flex-start", gap: spacing.md },
  empty: {
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyTitle: { ...typography.h3 },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  skeletonWrap: { gap: spacing.md },
  skeleton: {
    height: 104,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  previewOverlay: {
    flex: 1,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    backgroundColor: colors.overlay,
  },
  previewImage: { width: "100%", flex: 1 },
});
