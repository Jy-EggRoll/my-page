import { DEFAULT_LOCALE, LOCALES, type Locale } from '../config/i18n';

export interface ProjectEntry {
  name: string;
  summary: string;
  meta: string;
  highlight: string;
}

/**
 * 站点文案的唯一事实源：组件只消费这里的字段，不出现写死的文案。
 * 两种语言共用同一个接口，靠下面的构建期校验保证键完全一致。
 */
export interface SiteStrings {
  brand: string;
  notice: string;
  heroTitle: string;
  heroSubtitle: string;
  linkGithub: string;
  linkBlog: string;
  skillsLabel: string;
  skills: readonly string[];
  projectsLabel: string;
  projects: readonly ProjectEntry[];
  footer: string;
  langSwitcherLabel: string;
  pageTitle: string;
  pageDescription: string;
}

export const STRINGS: Record<Locale, SiteStrings> = {
  zh: {
    brand: '蛋卷儿',
    notice: '原型站点：4 套主题 × 中英双语均可实时切换，内容仍为占位文案。',
    heroTitle: '将工程美学融入技术细节',
    heroSubtitle: '以技术细节解决效率痛点。专注实用工具与运维开发，维护多个开源项目。',
    linkGithub: 'GitHub',
    linkBlog: '博客',
    skillsLabel: '常用技术',
    skills: ['Go', 'TypeScript', 'Python', 'Cloudflare Workers', 'Docker', 'K8s'],
    projectsLabel: '开源项目',
    projects: [
      {
        name: 'repodex',
        summary: '跨仓库、跨分支的全局文件检索，基于边缘计算与分布式索引。',
        meta: 'Cloudflare Workers · Durable Objects',
        highlight: '零配置 · 增量同步',
      },
      {
        name: 'vscode-monitor-pro',
        summary: 'VSCode 系统资源监控插件，Go 后端二进制配合平滑实时图表。',
        meta: 'TypeScript · Go',
        highlight: '200+ stars · 2 万+ 下载',
      },
      {
        name: 'my-github-stats',
        summary: '自托管的 GitHub 统计卡片生成器，直接产出 SVG。',
        meta: 'Zig',
        highlight: '本页面复用其产物',
      },
    ],
    footer: '原型页面 · 外观与内容均在迭代中',
    langSwitcherLabel: '切换语言',
    pageTitle: '蛋卷儿 · 个人主页',
    pageDescription: '将工程美学融入技术细节 —— 个人主页与开源项目索引。',
  },
  en: {
    brand: 'EggRoll',
    notice: 'Prototype: four themes and two languages switch live. Copy is still placeholder.',
    heroTitle: 'Engineering aesthetics, expressed in technical detail',
    heroSubtitle:
      'Solving efficiency pain points through technical detail. Focused on practical tooling and operations development, maintaining several open-source projects.',
    linkGithub: 'GitHub',
    linkBlog: 'Blog',
    skillsLabel: 'Technologies',
    skills: ['Go', 'TypeScript', 'Python', 'Cloudflare Workers', 'Docker', 'K8s'],
    projectsLabel: 'Open source',
    projects: [
      {
        name: 'repodex',
        summary:
          'Cross-repository, cross-branch global file search built on edge computing and distributed indexing.',
        meta: 'Cloudflare Workers · Durable Objects',
        highlight: 'Zero-config · incremental sync',
      },
      {
        name: 'vscode-monitor-pro',
        summary: 'A VS Code system resource monitor with a Go backend and smooth real-time charts.',
        meta: 'TypeScript · Go',
        highlight: '200+ stars · 20k+ downloads',
      },
      {
        name: 'my-github-stats',
        summary: 'A self-hosted GitHub stats card generator that emits SVG directly.',
        meta: 'Zig',
        highlight: 'This page reuses its output',
      },
    ],
    footer: 'Prototype · appearance and content are still being iterated on',
    langSwitcherLabel: 'Switch language',
    pageTitle: 'EggRoll · Personal site',
    pageDescription:
      'Engineering aesthetics in technical detail — personal site and open-source index.',
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
