import { en } from './locales/en';
import { zhCN } from './locales/zh-CN';

export const localeStorageKey = 'trpg-platform-locale';
export const defaultLocale = 'zh-CN';

export const messages = {
  'zh-CN': zhCN,
  en,
} as const;

export type Locale = keyof typeof messages;
export type TranslationKey = string;

export const supportedLocales = Object.keys(messages) as Locale[];

export function isSupportedLocale(value: string | null): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const storedLocale = window.localStorage.getItem(localeStorageKey);
  return isSupportedLocale(storedLocale) ? storedLocale : defaultLocale;
}

export function writeStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(localeStorageKey, locale);
}

function resolveMessage(locale: Locale, key: TranslationKey): unknown {
  const parts = key.split('.');

  const resolveFrom = (source: unknown) => (
    parts.reduce<unknown>((current, part) => {
      if (current && typeof current === 'object' && part in current) {
        return (current as Record<string, unknown>)[part];
      }
      return undefined;
    }, source)
  );

  return resolveFrom(messages[locale]) ?? resolveFrom(messages[defaultLocale]);
}

export function createTranslator(locale: Locale) {
  return {
    locale,
    t(key: TranslationKey): string {
      const value = resolveMessage(locale, key);
      return typeof value === 'string' ? value : key;
    },
    tList(key: TranslationKey): string[] {
      const value = resolveMessage(locale, key);
      return Array.isArray(value) ? [...value] : [];
    },
  };
}
