import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, Modal, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { uploadApi } from '../../api/uploads';
import { getAuthenticatedFileUrl } from '../../api/client';
import { colors, spacing, typography, radius } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useLocalization } from '../../context/LocalizationContext';

export function PetDocumentsScreen({ petId, onBack }: { petId: string; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [petId]);

  async function load() {
    setLoading(true);
    try {
      const r = await uploadApi.listPetDocuments(petId);
      setDocs(r || []);
    } catch (e) {
      Alert.alert(t('error','Errore'), t('load_docs_failed','Impossibile caricare i documenti'));
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen(d: any) {
    try {
      const url = d.url ?? await getAuthenticatedFileUrl(d.id);
      if (!url) throw new Error('no url');
      if (d.mime_type?.startsWith('image/')) {
        setPreview(url);
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert(t('error','Errore'), t('open_failed','Impossibile aprire il file'));
    }
  }

  async function handleDelete(id: string) {
    try {
      await uploadApi.deleteFile(id);
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      Alert.alert(t('error','Errore'), t('delete_failed','Impossibile eliminare il file'));
    }
  }

  function renderItem({ item }: { item: any }) {
    return (
      <Card style={styles.item}>
        <View style={styles.row}>
          {item.mime_type?.startsWith('image/') ? (
            <Image source={{ uri: item.url }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder}><Text style={styles.icon}>📄</Text></View>
          )}
          <View style={{ flex: 1, paddingLeft: spacing.md }}>
            <Text style={styles.name}>{item.original_name}</Text>
            <Text style={styles.meta}>{item.mime_type} • {Math.round((item.size || 0) / 1024)} KB</Text>
            <View style={styles.actions}>
              <Button label={t('open','Apri')} onPress={() => handleOpen(item)} variant="secondary" fullWidth={false} />
              <Button label={t('download','Scarica')} onPress={() => handleOpen(item)} variant="outline" fullWidth={false} />
              <Button label={t('delete','Elimina')} onPress={() => handleDelete(item.id)} variant="danger" fullWidth={false} />
            </View>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
      <View style={styles.header}>
        <Text style={styles.title}>{t('documents','Documenti')}</Text>
        <Button label={t('back','Indietro')} onPress={onBack} variant="ghost" fullWidth={false} />
      </View>

      <View style={styles.content}>
        <Text style={styles.lead}>{t('documents_lead','Gestisci i documenti sanitari e certificati del tuo animale')}</Text>
        {isUploading ? (
          <Button label={t('uploading','Caricamento...')} variant="secondary" onPress={() => {}} disabled={true} fullWidth={false} />
        ) : (
          <Button label={t('add_document','Aggiungi documento')} onPress={async () => {
            setIsUploading(true);
            try {
              const DocumentPicker = require('expo-document-picker');
              const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
              const raw = (() => { try { return JSON.stringify(res); } catch { return String(res); } })();

              let fileUri: string | undefined;
              let fileName: string | undefined;
              let fileMime: string | undefined;

              if ((res as any).type === 'success' && (res as any).uri) {
                fileUri = (res as any).uri;
                fileName = (res as any).name || `doc_${Date.now()}`;
                fileMime = (res as any).mimeType || (fileName?.endsWith('.pdf') ? 'application/pdf' : undefined);
              } else if ((res as any).uri) {
                fileUri = (res as any).uri;
                fileName = (res as any).name || `doc_${Date.now()}`;
                fileMime = (res as any).mimeType;
              } else if ((res as any).assets && (res as any).assets.length) {
                const a = (res as any).assets[0];
                fileUri = a.uri;
                fileName = a.fileName || a.name || `doc_${Date.now()}`;
                fileMime = a.type || a.mimeType;
              }

              if (!fileUri) {
                return;
              }

              try {
                const uploaded = await uploadApi.petDocument(petId, fileUri, fileName ?? `doc_${Date.now()}`, fileMime ?? 'application/octet-stream');
                if (!uploaded.url && uploaded.id) {
                  try {
                    uploaded.url = await getAuthenticatedFileUrl(uploaded.id);
                  } catch (e) {
                  }
                }
                setDocs(prev => [uploaded, ...prev]);
                Alert.alert(t('done','Fatto'), t('upload_success','Documento caricato.'));
              } catch (uploadErr) {
                Alert.alert(t('error','Errore'), uploadErr instanceof Error ? uploadErr.message : t('upload_failed','Caricamento fallito'));
              }
            } catch (e) {
              try {
                const ImagePicker = require('expo-image-picker');
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
                if (result.canceled || !result.assets.length) return;
                const asset = result.assets[0];
                const uri = asset.uri;
                const name = asset.fileName ?? `doc_${Date.now()}.jpg`;
                const mimeType = asset.mimeType ?? 'image/jpeg';
                  try {
                    const uploadedImg = await uploadApi.petDocument(petId, uri, name, mimeType);
                    if (!uploadedImg.url && uploadedImg.id) {
                      try {
                        uploadedImg.url = await getAuthenticatedFileUrl(uploadedImg.id);
                      } catch (e) {
                      }
                    }
                    setDocs(prev => [uploadedImg, ...prev]);
                    Alert.alert(t('done','Fatto'), t('upload_success','Documento caricato.'));
                  } catch (uploadErr) {
                  Alert.alert(t('error','Errore'), uploadErr instanceof Error ? uploadErr.message : t('upload_failed','Caricamento fallito'));
                }
              } catch (imgErr) {
                Alert.alert(t('error','Errore'), t('upload_failed','Caricamento fallito'));
              }
            } finally {
              setIsUploading(false);
            }
          }} fullWidth={false} />
        )}

        {debugLogs.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {debugLogs.slice(0, 6).map((l, i) => (
              <Text key={i} style={{ color: colors.textMuted, fontSize: 11 }}>{l}</Text>
            ))}
          </View>
        )}

        <FlatList
          data={docs}
          keyExtractor={(i) => i.id ?? i.url}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        />
      </View>

      <Modal visible={!!preview} transparent={true} onRequestClose={() => setPreview(null)}>
        <View style={styles.previewWrap}>
          <Image source={{ uri: preview || '' }} style={styles.preview} />
          <Button label={t('close','Chiudi')} onPress={() => setPreview(null)} variant="ghost" fullWidth={false} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { ...typography.h2 },
  content: { paddingHorizontal: spacing.lg },
  lead: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  item: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: '#fafafa' },
  thumbPlaceholder: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 28 },
  name: { ...typography.h4 },
  meta: { ...typography.caption, color: colors.textMuted },
  actions: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm },
  previewWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  preview: { width: '90%', height: '70%', resizeMode: 'contain' },
});
