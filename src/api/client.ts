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
  clear: () => AsyncStorage.multiRemove([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]),
};

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
  { method = 'GET', body, auth = true }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = await tokenStorage.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const doFetch = (hdrs: Record<string, string>) =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers: hdrs,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(headers);

  if (res.status === 401 && auth) {
    try {
      await performRefresh();
      const newToken = await tokenStorage.getAccess();
      if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
      res = await doFetch(headers);
    } catch (e) {
      await tokenStorage.clear();
      throw new Error('Unauthorized');
    }
  }

  if (res.status === 204) return undefined as unknown as T;

  const json: ApiEnvelope<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error ?? json.message ?? 'Unknown error');
  }

  return json.data as T;
}

let refreshPromise: Promise<void> | null = null;

async function performRefresh(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = await tokenStorage.getRefresh();
    if (!refresh) throw new Error('No refresh token');

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!res.ok) {
      await tokenStorage.clear();
      throw new Error('refresh failed');
    }

    const json = await res.json();
    if (!json.success) {
      await tokenStorage.clear();
      throw new Error(json.error ?? json.message ?? 'refresh failed');
    }

    const data = json.data as unknown as { token: string; refresh_token: string };
    if (!data || !data.token) {
      await tokenStorage.clear();
      throw new Error('invalid refresh response');
    }

    await tokenStorage.setAccess(data.token);
    if (data.refresh_token) await tokenStorage.setRefresh(data.refresh_token);
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export default request;
