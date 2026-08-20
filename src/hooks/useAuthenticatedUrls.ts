import { useState, useEffect } from 'react';
import { tokenStorage } from '../api/client';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';
const FILES_BASE = BASE_URL.replace(/\/api$/, '');

export interface AuthenticatedImageSource {
  uri: string;
  headers?: Record<string, string>;
}

function extractFileId(value: string): string | null {
  const apiMatch = value.match(/\/api\/files\/([0-9a-f-]{36})/i);
  if (apiMatch) return apiMatch[1];

  const uuidMatch = value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  if (uuidMatch) return value;

  return null;
}

export function useAuthenticatedImageSource(
  fileIdOrUrl: string | null | undefined,
): AuthenticatedImageSource | undefined {
  const [source, setSource] = useState<AuthenticatedImageSource | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    if (!fileIdOrUrl) {
      setSource(undefined);
      return;
    }

    (async () => {
      const fileId = extractFileId(fileIdOrUrl);

      if (!fileId) {
        if (!cancelled) setSource({ uri: fileIdOrUrl });
        return;
      }

      const token = await tokenStorage.getAccess();
      let uri = `${FILES_BASE}/api/files/${fileId}/stream`;
      if (token) {
        const sep = uri.includes('?') ? '&' : '?';
        uri = `${uri}${sep}token=${encodeURIComponent(token)}`;
      }

      if (cancelled) return;
      setSource({
        uri,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [fileIdOrUrl]);

  return source;
}
