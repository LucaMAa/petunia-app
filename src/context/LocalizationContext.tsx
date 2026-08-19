import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import request from '../api/client';

type Translations = Record<string, string>;

interface LocalizationContextValue {
  locale: string;
  translations: Translations;
  t: (key: string, fallback?: string) => string;
  formatDate: (value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => { date: string; time: string };
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

async function fetchTranslations(locale: string): Promise<Translations> {
  try {
    const res = await request<Record<string, string>>(`/translations?locale=${encodeURIComponent(locale)}`, { auth: false });
    return res ?? {};
  } catch (e) {
    return {};
  }
}

function detectDeviceLocale(): string {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().locale;
    if (resolved) return resolved;
  } catch (e) {
  }
  return 'en-US';
}

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string>(() => detectDeviceLocale());
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      const t = await fetchTranslations(locale);
      if (mounted) setTranslations(t ?? {});
    })();
    return () => { mounted = false; };
  }, [locale]);

  function t(key: string, fallback?: string) {
    return translations[key] ?? fallback ?? key;
  }

  function formatDate(value: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = {}) {
    if (value == null) return '—';
    const d = typeof value === 'string' ? new Date(value) : value;
    try {
      return d.toLocaleDateString(locale, options);
    } catch {
      return d.toDateString();
    }
  }

  function formatTime(value: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = {}) {
    if (value == null) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    try {
      return d.toLocaleTimeString(locale, options);
    } catch {
      return d.toTimeString().slice(0,5);
    }
  }

  function formatDateTime(value: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = {}) {
    return { date: formatDate(value, options), time: formatTime(value, options) };
  }

  return (
    <LocalizationContext.Provider value={{ locale, translations, t, formatDate, formatTime, formatDateTime }}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error('useLocalization must be used within LocalizationProvider');
  return ctx;
}

export default LocalizationContext;
