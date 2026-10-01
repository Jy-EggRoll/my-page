/**
 * 语言清单。属性名与 astro.config.mjs 里的 i18n 配置必须保持一致：
 * defaultLocale 用默认语言、locales 是这里的全集、prefixDefaultLocale 为 false。
 */
export const LOCALES = ['zh', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'zh';

export interface LocaleMeta {
  /** 该语言自身的名称，用于语言切换器（按惯例不翻译成对方语言） */
  label: string;
  /** <html lang> 与 hreflang 使用的值 */
  htmlLang: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  zh: { label: '中文', htmlLang: 'zh-CN' },
  en: { label: 'English', htmlLang: 'en' },
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
