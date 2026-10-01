import { DEFAULT_LOCALE, LOCALES, type Locale } from '../config/i18n';
import type { ContactId } from '../config/site';

/**
 * 界面文案（不是简历内容 —— 简历内容在 src/data/resume.ts）。
 * 两种语言共用同一个接口，靠下面的构建期校验保证结构完全一致。
 */
export interface SiteStrings {
  brand: string;
  pageTitle: string;
  pageDescription: string;
  notice: string;
  linkGithub: string;
  linkBlog: string;

  summaryLabel: string;
  statsLabel: string;
  contactsLabel: string;
  contactLabels: Record<ContactId, string>;

  footer: string;
  langSwitcherLabel: string;
  /** 终端版式左侧路径导航的 aria-label */
  railNavLabel: string;
}

export const STRINGS: Record<Locale, SiteStrings> = {
  zh: {
    brand: '蛋卷儿',
    pageTitle: '蛋卷儿 · 个人主页',
    pageDescription: '将工程美学融入技术细节 —— 个人主页与开源项目索引。',
    notice: '原型站点：4 套主题与中英双语均可实时切换，内容与正式文案仍在迭代。',
    linkGithub: 'GitHub',
    linkBlog: '博客',

    summaryLabel: '关于我',
    statsLabel: 'GitHub 统计',
    contactsLabel: '联系方式',
    contactLabels: {
      github: 'GitHub',
      blog: '博客',
      email: '邮箱',
    },

    footer: '由 Astro 与 Tailwind CSS 构建',
    langSwitcherLabel: '切换语言',
    railNavLabel: '页面内导航',
  },
  en: {
    brand: 'EggRoll',
    pageTitle: 'EggRoll · Personal site',
    pageDescription:
      'Engineering aesthetics woven into technical detail — personal site and open-source index.',
    notice:
      'Prototype: four themes and two languages can be switched instantly. Content and final copy are still in progress.',
    linkGithub: 'GitHub',
    linkBlog: 'Blog',

    summaryLabel: 'About',
    statsLabel: 'GitHub stats',
    contactsLabel: 'Contact',
    contactLabels: {
      github: 'GitHub',
      blog: 'Blog',
      email: 'Email',
    },

    footer: 'Built with Astro and Tailwind CSS',
    langSwitcherLabel: 'Switch language',
    railNavLabel: 'On this page',
  },
};

export function stringsFor(locale: Locale): SiteStrings {
  return STRINGS[locale];
}

/** 递归收集结构的路径名，数组以 `[]` 标记（只比较元素形状，不比较长度）。 */
function collectShape(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    const first = value.at(0);
    return first === undefined ? [`${prefix}[]`] : collectShape(first, `${prefix}[]`);
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      collectShape(child, prefix === '' ? key : `${prefix}.${key}`),
    );
  }
  return [prefix];
}

/**
 * 构建期校验：各语言的文案结构必须完全一致。
 * 少写一条文案就让构建失败并点名是哪条，而不是等到线上才发现某个语言缺一段。
 */
function assertSameShape(): void {
  const reference = DEFAULT_LOCALE;
  const referenceKeys = new Set(collectShape(STRINGS[reference]));
  for (const locale of LOCALES) {
    if (locale === reference) continue;
    const keys = new Set(collectShape(STRINGS[locale]));
    const missing = [...referenceKeys].filter((key) => !keys.has(key));
    const extra = [...keys].filter((key) => !referenceKeys.has(key));
    if (missing.length > 0 || extra.length > 0) {
      throw new Error(
        `文案结构不一致：以 ${reference} 为基准，${locale} 缺少 [${missing.join(', ') || '无'}]、` +
          `多出 [${extra.join(', ') || '无'}]。请补齐 src/data/strings.ts`,
      );
    }
  }
}

assertSameShape();
