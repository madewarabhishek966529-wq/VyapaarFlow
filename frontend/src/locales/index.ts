import { en } from './en';
import { hi } from './hi';
import { mr } from './mr';

export type LanguageCode = 'en' | 'hi' | 'mr';

export const translations = {
  en,
  hi,
  mr
};

/**
 * Nested key lookup helper: t('dashboard.todaySales')
 */
export function getTranslation(lang: LanguageCode, path: string): string {
  const dict = translations[lang] || translations.en;
  const keys = path.split('.');
  let result: any = dict;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      // Fallback to English
      let fallback: any = translations.en;
      for (const fKey of keys) {
        if (fallback && typeof fallback === 'object' && fKey in fallback) {
          fallback = fallback[fKey];
        } else {
          return path;
        }
      }
      return typeof fallback === 'string' ? fallback : path;
    }
  }

  return typeof result === 'string' ? result : path;
}
