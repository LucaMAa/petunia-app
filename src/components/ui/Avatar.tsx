import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { radius } from '../../styles/theme';
import { useAuthenticatedImageSource } from '../../hooks/useAuthenticatedUrls';

interface AvatarProps {
  name?: string;
  uri?:  string;
  size?: number;
  style?: ViewStyle | ImageStyle;
  shape?: 'circle' | 'rounded';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

const PALETTE = [
  { bg: '#F5E6D8', text: '#7A3D22' },
  { bg: '#E8F0E6', text: '#2E5E3A' },
  { bg: '#E6EBF5', text: '#2B3F7A' },
  { bg: '#F0E6F5', text: '#5E2B7A' },
  { bg: '#F5E6E6', text: '#7A2B2B' },
  { bg: '#E6F5F0', text: '#2B7A60' },
  { bg: '#F5F0E6', text: '#7A5C2B' },
  { bg: '#EBE6F5', text: '#432B7A' },
];

function nameToColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({ name = '', uri, size = 44, style, shape = 'circle' }: AvatarProps) {
  const fontSize = size * 0.37;
  const borderR  = shape === 'circle' ? size / 2 : radius.sm;
  const { bg, text } = nameToColors(name);

  const source = useAuthenticatedImageSource(uri);

  if (source) {
    return (
      <Image
        source={source}
        style={[
          { width: size, height: size, borderRadius: borderR },
          style as ImageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: borderR, backgroundColor: bg },
        styles.container,
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize, color: text }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  initials:  { fontWeight: '700' },
});
