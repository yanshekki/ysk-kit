export type Locale = 'zh-HK' | 'en';

export const DEFAULT_LOCALE: Locale = 'zh-HK';

export const t = <K extends string>(
  dict: Record<K, Record<Locale, string>>,
  key: K,
  locale: Locale = DEFAULT_LOCALE,
): string => dict[key][locale];
