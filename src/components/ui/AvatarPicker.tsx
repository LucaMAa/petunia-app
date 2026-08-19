import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from './Avatar';
import { useLocalization } from '../../context/LocalizationContext';
import { colors, radius, shadow } from '../../styles/theme';
import { useAlert } from './AlertContext';

interface AvatarPickerProps {
  currentUrl?: string;
  name?: string;
  size?: number;
  onPick: (uri: string, fileName: string, mimeType: string) => Promise<void>;
  style?: ViewStyle;
}

export function AvatarPicker({
  currentUrl,
  name = '',
  size = 96,
  onPick,
  style,
}: AvatarPickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { t } = useLocalization();
  const { showAlert } = useAlert();

  async function handlePress() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert(
        t('access_denied_msg','Consenti l\'accesso alla galleria nelle impostazioni per cambiare la foto.'),
        { type: 'error' },
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const fileName = asset.fileName ?? `avatar_${Date.now()}.jpg`;
    const mimeType = asset.mimeType ?? 'image/jpeg';

    setIsUploading(true);
    try {
      await onPick(uri, fileName, mimeType);
    } catch (e) {
      showAlert(e instanceof Error ? e.message : t('upload_failed','Caricamento fallito'), { type: 'error' });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      disabled={isUploading}
      style={[style]}
    >
      <View style={{ position: 'relative' }}>
        {/*
          Avatar risolve internamente currentUrl:
          - se è un UUID o /api/files/:id → aggiunge il token JWT
          - se è vuoto → mostra le iniziali
        */}
        <Avatar uri={currentUrl || undefined} name={name} size={size} />

        {!isUploading && (
          <View style={[styles.badge, {
            width: size * 0.32,
            height: size * 0.32,
            borderRadius: size * 0.16,
          }]}>
            <Text style={[styles.badgeIcon, { fontSize: size * 0.16 }]}>✏️</Text>
          </View>
        )}

        {isUploading && (
          <View style={[
            StyleSheet.absoluteFillObject,
            styles.spinnerOverlay,
            { borderRadius: size / 2 },
          ]}>
            <ActivityIndicator color={colors.textOnPrimary} size="small" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadow.sm,
  },
  badgeIcon: {},
  spinnerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
