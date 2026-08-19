import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Image, Modal } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { colors, spacing, typography, radius, shadow } from '../../styles/theme';
import { useAuthenticatedImageSource } from '../../hooks/useAuthenticatedUrls';
import { uploadApi } from '../../api/uploads';
import { getAuthenticatedFileUrl } from '../../api/client';
import { useLocalization } from '../../context/LocalizationContext';
import { useAlert } from './AlertContext';

interface DocumentRecord {
  id?: string;
  url?: string;
  original_name?: string;
  mime_type?: string;
}

export function DocumentsSection({
  petId,
  docs,
  onUploaded,
}: {
  petId: string;
  docs: DocumentRecord[];
  onUploaded?: () => void;
}) {
  const { t } = useLocalization();
  const { showAlert } = useAlert();
  const [isUploading, setIsUploading] = useState(false);
  const [localDocs, setLocalDocs] = useState<DocumentRecord[]>(docs || []);
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  function DocumentThumb({ d, urlMap }: { d: DocumentRecord; urlMap: Record<string, string> }) {
    const fileRef = d.url ?? (d.id ? urlMap[d.id] : undefined);
    const source = useAuthenticatedImageSource(fileRef);
    if (!source) return null;
    return <Image source={source as any} style={styles.thumbSmall} />;
  }

  React.useEffect(() => {
    const toResolve: string[] = [];
    const next: Record<string, string> = {};
    localDocs.forEach(d => {
      if (d.url && typeof d.url === 'string') {
        if (d.url.startsWith('/')) {
          const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api').replace(/\/api$/, '');
          next[d.id ?? d.url] = base + d.url;
        } else {
          next[d.id ?? d.url] = d.url;
        }
      } else if (d.id && !urlMap[d.id]) {
        toResolve.push(d.id);
      }
    });
    if (Object.keys(next).length) setUrlMap(prev => ({ ...prev, ...next }));
    if (toResolve.length) {
      toResolve.forEach(async (id) => {
        try {
          const u = await getAuthenticatedFileUrl(id);
          setUrlMap(prev => ({ ...prev, [id]: u }));
        } catch (e) {
        }
      });
    }
  }, [localDocs, urlMap]);

  React.useEffect(() => {
    const incoming = docs || [];
    setLocalDocs(prev => {
      const map = new Map<string, DocumentRecord>();
      incoming.forEach(d => map.set((d.id ?? d.url) ?? String(Math.random()), d));
      prev.forEach(d => {
        const key = (d.id ?? d.url) ?? String(Math.random());
        if (!map.has(key)) map.set(key, d);
      });
      return Array.from(map.values());
    });
  }, [docs]);

  async function handleAdd() {
    setIsUploading(true);
    try {
      const DocumentPicker = require('expo-document-picker');
      const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
      const raw = (() => { try { return JSON.stringify(res); } catch { return String(res); }})();
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
        setLocalDocs(prev => [uploaded as DocumentRecord, ...prev]);
        showAlert(t('upload_success','Documento caricato.'), { type: 'success' });
        if (onUploaded) await onUploaded();
      } catch (uploadErr) {
        showAlert(uploadErr instanceof Error ? uploadErr.message : t('upload_failed','Caricamento fallito'), { type: 'error' });
      }
    } catch (e) {
      try {
        const ImagePicker = require('expo-image-picker');
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (result.canceled || !result.assets.length) {
          return;
        }
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
          setLocalDocs(prev => [uploadedImg as DocumentRecord, ...prev]);
          showAlert(t('upload_success','Documento caricato.'), { type: 'success' });
          if (onUploaded) await onUploaded();
        } catch (uploadErr) {
          showAlert(uploadErr instanceof Error ? uploadErr.message : t('upload_failed','Caricamento fallito'), { type: 'error' });
        }
      } catch (imgErr) {
        showAlert(imgErr instanceof Error ? imgErr.message : t('upload_failed','Caricamento fallito'), { type: 'error' });
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function openDoc(d: DocumentRecord) {
    try {
      const isImage = d.mime_type?.startsWith('image/');
      if (isImage) {
        let url = d.url ?? (d.id ? urlMap[d.id] : undefined);
        if (!url && d.id) {
          try {
            const resolvedUrl = await getAuthenticatedFileUrl(d.id);
            if (resolvedUrl) {
              url = resolvedUrl;
              setUrlMap(prev => ({ ...prev, [d.id as string]: resolvedUrl }));
            }
          } catch (e) {
          }
        }
        if (url) {
          setPreviewLoading(true);
          setPreview(url);
          return;
        }
      }
      if (d.url) {
        await Linking.openURL(d.url);
        return;
      }
      if (d.id) {
        const url = await getAuthenticatedFileUrl(d.id);
        await Linking.openURL(url);
        return;
      }
      showAlert(t('open_failed','Impossibile aprire il file'), { type: 'error' });
    } catch (e) {
      showAlert(t('open_failed','Impossibile aprire il file'), { type: 'error' });
    }
  }

  const previewSource = useAuthenticatedImageSource(preview ?? undefined);

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('documents','Documenti')}</Text>
        <View style={styles.headerRight}>
          {isUploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Button label={t('add_document','Aggiungi')} onPress={handleAdd} variant="secondary" fullWidth={false} />
          )}
        </View>
      </View>

      {localDocs.length === 0 ? (
        <Text style={styles.empty}>{t('no_documents','Nessun documento')}</Text>
      ) : (
        localDocs.map(d => (
          <View key={d.id ?? d.url} style={styles.row}>
            <TouchableOpacity style={styles.metaTouch} onPress={() => openDoc(d)}>
              {d.mime_type?.startsWith('image/') ? (
                <DocumentThumb d={d} urlMap={urlMap} />
              ) : null}
              <Text style={styles.name}>{d.original_name ?? d.url}</Text>
              <Text style={styles.mime}>{d.mime_type ?? ''}</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.actionBtn, { marginLeft: 0 }]} onPress={() => openDoc(d)}>
                <Text style={styles.actionText}>{t('open','Apri')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={async () => {
                try {
                  const url = d.url ?? (d.id ? await getAuthenticatedFileUrl(d.id) : undefined);
                  if (url) await Linking.openURL(url);
                  } catch (e) {
                  showAlert(t('open_failed','Impossibile aprire il file'), { type: 'error' });
                }
              }}>
                <Text style={styles.actionText}>{t('download','Scarica')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
      {preview ? (
        <Modal visible={true} transparent={true} onRequestClose={() => setPreview(null)}>
          <View style={modalStyles.wrap}>
            {previewLoading && <ActivityIndicator color={colors.textOnPrimary} size="large" />}
            <Image
              source={(previewSource as any) ?? { uri: preview ?? '' }}
              style={modalStyles.image}
              onLoadStart={() => setPreviewLoading(true)}
              onLoadEnd={() => setPreviewLoading(false)}
            />
            <Button label={t('close','Chiudi')} onPress={() => setPreview(null)} variant="ghost" fullWidth={false} />
          </View>
        </Modal>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  headerRight: { minWidth: 110, alignItems: 'flex-end' },
  title: { ...typography.h3 },
  empty: { marginTop: spacing.sm, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metaTouch: { flex: 1, paddingRight: spacing.sm },
  name: { ...typography.bodyMedium },
  mime: { ...typography.caption, color: colors.textMuted },
  actions: { flexDirection: 'row' },
  actionBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: 'transparent', marginLeft: spacing.sm },
  actionText: { color: colors.primary, fontWeight: '600' },
  thumbSmall: { width: 56, height: 56, borderRadius: radius.md, marginBottom: spacing.xs },
});

const modalStyles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  image: { width: '90%', height: '70%', resizeMode: 'contain' },
});
