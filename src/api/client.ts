import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiEnvelope } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@petunia:access_token',
  REFRESH_TOKEN: '@petunia:refresh_token',
} as const;


export const tokenStorage = {
  getAccess: () => AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  getRefresh: () => AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setAccess: (t: string) => AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, t),
  setRefresh: (t: string) => AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, t),
  clear: () =>
    AsyncStorage.multiRemove([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]),
};

/**
 * URL "piatto" (con token in query) per contesti che non possono impostare
 * header custom, es. WebView o link condivisi. Per <Image> preferisci
 * useAuthenticatedImageSource, che usa l'header Authorization.
 */
export async function getAuthenticatedFileUrl(fileId: string): Promise<string> {
  const token = await tokenStorage.getAccess();
  const base = BASE_URL.replace(/\/api$/, '');
  const url = `${base}/api/files/${fileId}/stream`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

async function request<T>(
  path: string,
  { method = 'GET', body, auth = true }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = await tokenStorage.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as unknown as T;

  const json: ApiEnvelope<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error ?? json.message ?? 'Unknown error');
  }

  return json.data as T;
}

export default request;
