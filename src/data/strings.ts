import { DEFAULT_LOCALE, LOCALES, type Locale } from '../config/i18n';
import type { ContactId } from '../config/site';

export interface ProjectEntry {
  name: string;
  summary: string;
  meta: string;
  highlight: string;
}

export interface SkillGroup {
  label: string;
  items: readonly string[];
}

export interface TimelineEntry {
  period: string;
  title: string;
  detail: string;
}

/**
 * 站点文案的唯一事实源：组件只消费这里的字段，不出现写死的文案。
 * 两种语言共用同一个接口，靠下面的构建期校验保证结构完全一致。
 */
export interface SiteStrings {
  brand: string;
  pageTitle: string;
  pageDescription: string;
  notice: string;
  heroTitle: string;
  heroSubtitle: string;
  linkGithub: string;
  linkBlog: string;

  aboutLabel: string;
  about: readonly string[];

  skillsLabel: string;
  skillGroups: readonly SkillGroup[];
  timeline: readonly TimelineEntry[];

  projectsLabel: string;
  projects: readonly ProjectEntry[];

  statsLabel: string;

  contactsLabel: string;
  contactLabels: Record<ContactId, string>;

  footer: string;
  langSwitcherLabel: string;
}

export const STRINGS: Record<Locale, SiteStrings> = {
  zh: {
    brand: '蛋卷儿',
    pageTitle: '蛋卷儿 · 个人主页',
    pageDescription: '将工程美学融入技术细节 —— 个人主页与开源项目索引。',
    notice: '原型站点：4 套主题与中英双语均可实时切换，内容与正式文案仍在迭代。',
    heroTitle: '将工程美学融入技术细节',
    heroSubtitle: '以技术细节解决效率痛点。专注实用工具与运维开发，维护多个开源项目。',
    linkGithub: 'GitHub',
    linkBlog: '博客',

    aboutLabel: '关于我',
    about: [
      '北京邮电大学计算机学院数据科学与大数据技术专业本科在读。',
      '专注实用工具与运维开发，熟悉从需求调研、方案设计到上线迭代的完整链路，独立维护多个开源项目。',
      '偏好用代码化手段替代人工重复操作，关注跨平台系统底层、自动化与工程化。',
    ],

    skillsLabel: '技能与经历',
    skillGroups: [
      { label: '全栈开发', items: ['Go', 'TypeScript', 'JavaScript', 'Python'] },
      { label: '云原生与运维', items: ['Docker', 'K8s', 'Cloudflare Workers', 'Linux'] },
      { label: '工程化与自动化', items: ['Git', 'CI/CD', 'CLI 工具', '脚本自动化'] },
    ],
    timeline: [
      {
        period: '2026.07 – 2026.09',
        title: '腾讯 · 云与智慧产业事业群（CSIG）· 架构师实习生',
        detail: '面向客户做上云迁移与疑难故障排查，沉淀可复用的排障文档与 AI 辅助工作流。',
      },
      {
        period: '2026.08',
        title: '腾讯云 TCCP 云架构师高级工程师认证',
        detail: '系统梳理腾讯云产品体系并通过认证。',
      },
      {
        period: '2025.09 – 至今',
        title: 'WorldQuant BRAIN 研究顾问（Gold）',
        detail: '量化金融方向的兼职研究顾问。',
      },
      {
        period: '2025',
        title: '帆软训练营 · 优秀产品经理',
        detail: '在训练营中完成完整的产品设计与打磨。',
      },
      {
        period: '2023.10 – 2025.10',
        title: '北京邮电大学 · 北邮人团队 · 产品运营组',
        detail: '负责校园运维与效率工具的需求调研与方案设计。',
      },
    ],

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

    contactsLabel: '联系方式',
    contactLabels: {
      github: 'GitHub',
      blog: '博客',
      email: '邮箱',
      qq: 'QQ',
      bilibili: '哔哩哔哩',
    },

    statsLabel: 'GitHub 统计',

    footer: '由 Astro 与 Tailwind CSS 构建',
    langSwitcherLabel: '切换语言',
  },
  en: {
    brand: 'EggRoll',
    pageTitle: 'EggRoll · Personal site',
    pageDescription:
      'Engineering aesthetics in technical detail — personal site and open-source index.',
    notice:
      'Prototype: four themes and two languages switch live. Content and final copy are still being iterated on.',
    heroTitle: 'Engineering aesthetics, expressed in technical detail',
    heroSubtitle:
      'Solving efficiency pain points through technical detail. Focused on practical tooling and operations development, maintaining several open-source projects.',
    linkGithub: 'GitHub',
    linkBlog: 'Blog',

    aboutLabel: 'About',
    about: [
      'Undergraduate in Data Science and Big Data Technology at the School of Computer Science, Beijing University of Posts and Telecommunications.',
      'Focused on practical tooling and operations development, comfortable with the whole path from research and design through release and iteration, maintaining several open-source projects independently.',
      'Prefers replacing repetitive manual work with code, with an interest in cross-platform system internals, automation and engineering practice.',
    ],

    skillsLabel: 'Skills & experience',
    skillGroups: [
      { label: 'Full-stack', items: ['Go', 'TypeScript', 'JavaScript', 'Python'] },
      { label: 'Cloud & operations', items: ['Docker', 'K8s', 'Cloudflare Workers', 'Linux'] },
      { label: 'Engineering & automation', items: ['Git', 'CI/CD', 'CLI tooling', 'Scripting'] },
    ],
    timeline: [
      {
        period: 'Jul 2026 – Sep 2026',
        title: 'Tencent · CSIG · Cloud Architect Intern',
        detail:
          'Supported customer cloud migrations and hard-to-diagnose faults, producing reusable troubleshooting docs and AI-assisted workflows.',
      },
      {
        period: 'Aug 2026',
        title: 'Tencent Cloud TCCP – Cloud Architect (Professional)',
        detail: 'Studied the Tencent Cloud product landscape and passed the certification.',
      },
      {
        period: 'Sep 2025 – present',
        title: 'WorldQuant BRAIN Research Consultant (Gold)',
        detail: 'Part-time research consultant in quantitative finance.',
      },
      {
        period: '2025',
        title: 'FanRuan Product Camp · Outstanding Product Manager',
        detail: 'Took a product through a full design and refinement cycle in the camp.',
      },
      {
        period: 'Oct 2023 – Oct 2025',
        title: 'BUPT · Beiyouren Team · Product Operations',
        detail:
          'Owned requirement research and solution design for campus operations and productivity tooling.',
      },
    ],

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

    contactsLabel: 'Contact',
    contactLabels: {
      github: 'GitHub',
      blog: 'Blog',
      email: 'Email',
      qq: 'QQ',
      bilibili: 'Bilibili',
    },

    statsLabel: 'GitHub stats',

    footer: 'Built with Astro and Tailwind CSS',
    langSwitcherLabel: 'Switch language',
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
